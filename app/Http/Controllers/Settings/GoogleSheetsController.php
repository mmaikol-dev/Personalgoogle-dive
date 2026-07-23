<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\GoogleSheetsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoogleSheetsController extends Controller
{
    public function edit(Request $request): Response
    {
        $team = $request->user()->currentTeam;
        $sheetNames = [];
        $connectionError = null;

        if ($team?->google_sheet_id) {
            try {
                $sheetNames = app(GoogleSheetsService::class)->sheetNames($team);
            } catch (\Throwable $exception) {
                $connectionError = 'Could not load sheets. Check the spreadsheet ID and service-account access.';
            }
        }

        return Inertia::render('settings/google-sheets', [
            'integration' => [
                'spreadsheet_id' => $team?->google_sheet_id,
                'sheet_name' => $team?->google_sheet_name,
            ],
            'sheetNames' => $sheetNames,
            'connectionError' => $connectionError,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'spreadsheet_id' => ['nullable', 'string', 'max:255'],
            'sheet_name' => ['nullable', 'string', 'max:100'],
        ]);

        $request->user()->currentTeam?->update([
            'google_sheet_id' => $data['spreadsheet_id'] ?: null,
            'google_sheet_name' => $data['sheet_name'] ?: null,
        ]);

        return back()->with('status', 'Google Sheets integration saved.');
    }

    public function preview(Request $request)
    {
        $data = $request->validate([
            'sheet_name' => ['required', 'string', 'max:100'],
        ]);

        try {
            $values = app(GoogleSheetsService::class)->preview(
                $request->user()->currentTeam,
                $data['sheet_name'],
            );
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Could not load this sheet.'], 422);
        }

        return response()->json(['values' => $values]);
    }
}
