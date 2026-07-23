<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Services\GoogleSheetsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if (! $token || $token !== config('app.api_token')) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:102400'],
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'expires_in_hours' => ['nullable', 'integer', 'in:0,24,168,720'],
            'password' => ['nullable', 'string', 'min:4', 'max:255'],
            'max_downloads' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'slug' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9\-]+$/i'],
            'folder' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'google_sheet_name' => ['nullable', 'string', 'max:100'],
        ]);

        $uploaded = $request->file('file');
        $uuid = (string) Str::uuid();
        $originalName = $uploaded->getClientOriginalName();
        $path = $uploaded->storeAs($uuid, $originalName, 'drive');

        if ($path === false) {
            return response()->json(['message' => 'The file could not be saved. Please try again.'], 500);
        }

        $data = [
            'team_id' => (int) $request->get('team_id'),
            'user_id' => (int) $request->get('user_id'),
            'uuid' => $uuid,
            'name' => $uuid,
            'original_name' => $originalName,
            'mime_type' => $uploaded->getMimeType(),
            'size' => $uploaded->getSize(),
            'disk' => 'drive',
            'path' => $path,
            'folder' => $request->get('folder'),
            'tags' => $request->get('tags'),
        ];

        if ($request->has('expires_in_hours') && (int) $request->get('expires_in_hours') > 0) {
            $data['expires_at'] = now()->addHours((int) $request->get('expires_in_hours'));
        }

        if ($request->has('password')) {
            $data['password_hash'] = $request->get('password') ? Hash::make($request->get('password')) : null;
        }

        if ($request->has('max_downloads')) {
            $data['max_downloads'] = (int) $request->get('max_downloads');
        }

        if ($request->has('slug')) {
            $data['slug'] = $request->get('slug');
        }

        $file = File::create($data);

        $googleSheetsSynced = false;

        try {
            $googleSheetsSynced = app(GoogleSheetsService::class)->appendUpload(
                $file->team,
                $file,
                $request->string('caption')->toString(),
                $request->string('google_sheet_name')->toString() ?: null,
            );
        } catch (\Throwable $exception) {
            Log::error('Unable to append API upload to Google Sheets.', [
                'file_id' => $file->id,
                'exception' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'google_sheets_synced' => $googleSheetsSynced,
            'file' => $file->toArray(),
        ], 201);
    }
}
