<?php

namespace App\Services;

use App\Models\File;
use App\Models\Team;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleSheetsService
{
    public function appendUpload(Team $team, File $file, ?string $caption, ?string $sheetName = null): bool
    {
        $sheetName ??= $team->google_sheet_name;

        if (blank($team->google_sheet_id) || blank($sheetName)) {
            return false;
        }

        $credentials = $this->credentials();
        $accessToken = $this->accessToken($credentials);
        $sheetNames = $this->sheetNamesForToken($team->google_sheet_id, $accessToken);

        if (! in_array($sheetName, $sheetNames, true)) {
            throw new RuntimeException('The selected sheet is not available in this spreadsheet.');
        }

        $range = rawurlencode($sheetName).'!A:D';

        Http::withToken($accessToken)
            ->acceptJson()
            ->post(
                "https://sheets.googleapis.com/v4/spreadsheets/{$team->google_sheet_id}/values/{$range}:append?"
                .http_build_query([
                    'valueInputOption' => 'USER_ENTERED',
                    'insertDataOption' => 'INSERT_ROWS',
                ]),
                [
                    'range' => "{$sheetName}!A:D",
                    'majorDimension' => 'ROWS',
                    'values' => [[
                        $file->share_url,
                        $caption ?? '',
                        '',
                        $file->post_type ?? '',
                    ]],
                ],
            )
            ->throw();

        return true;
    }

    /** @return list<string> */
    public function sheetNames(Team $team): array
    {
        if (blank($team->google_sheet_id)) {
            return [];
        }

        return $this->sheetNamesForToken($team->google_sheet_id, $this->accessToken($this->credentials()));
    }

    /** @return list<list<string>> */
    public function preview(Team $team, string $sheetName): array
    {
        $sheetNames = $this->sheetNames($team);

        if (! in_array($sheetName, $sheetNames, true)) {
            throw new RuntimeException('The selected sheet is not available in this spreadsheet.');
        }

        $accessToken = $this->accessToken($this->credentials());
        $range = rawurlencode($sheetName).'!A1:C100';
        $values = Http::withToken($accessToken)
            ->acceptJson()
            ->get("https://sheets.googleapis.com/v4/spreadsheets/{$team->google_sheet_id}/values/{$range}")
            ->throw()
            ->json('values', []);

        return is_array($values) ? $values : [];
    }

    /** @return list<string> */
    private function sheetNamesForToken(string $spreadsheetId, string $accessToken): array
    {
        $sheets = Http::withToken($accessToken)
            ->acceptJson()
            ->get("https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}?fields=sheets.properties.title")
            ->throw()
            ->json('sheets', []);

        if (! is_array($sheets)) {
            return [];
        }

        return collect($sheets)
            ->pluck('properties.title')
            ->filter(fn ($title) => is_string($title) && $title !== '')
            ->values()
            ->all();
    }

    /** @return array<string, string> */
    private function credentials(): array
    {
        $path = config('services.google_sheets.credentials_path');

        if (! is_string($path) || ! is_file($path)) {
            throw new RuntimeException('Google Sheets service-account credentials are not configured.');
        }

        $credentials = json_decode((string) file_get_contents($path), true);

        if (! is_array($credentials)
            || empty($credentials['client_email'])
            || empty($credentials['private_key'])
            || empty($credentials['token_uri'])) {
            throw new RuntimeException('Google Sheets service-account credentials are invalid.');
        }

        return $credentials;
    }

    /** @param array<string, string> $credentials */
    private function accessToken(array $credentials): string
    {
        $now = time();
        $claims = [
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/spreadsheets',
            'aud' => $credentials['token_uri'],
            'iat' => $now,
            'exp' => $now + 3600,
        ];
        $unsignedToken = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR))
            .'.'.$this->base64Url(json_encode($claims, JSON_THROW_ON_ERROR));

        if (openssl_sign($unsignedToken, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256) !== true) {
            throw new RuntimeException('Unable to sign the Google service-account token.');
        }

        $response = Http::asForm()
            ->post($credentials['token_uri'], [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $unsignedToken.'.'.$this->base64Url($signature),
            ])
            ->throw();

        $accessToken = $response->json('access_token');

        if (! is_string($accessToken) || $accessToken === '') {
            throw new RuntimeException('Google did not return an access token.');
        }

        return $accessToken;
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
