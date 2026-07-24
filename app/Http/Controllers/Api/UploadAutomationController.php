<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadAutomationController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if (! $token || $token !== config('app.api_token')) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $request->validate([
            'file_url' => ['required', 'string', 'url', 'max:2048'],
            'post_type' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $fileUrl = $request->input('file_url');

        $response = Http::timeout(60)->get($fileUrl);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to download file from URL.'], 502);
        }

        $binaryData = $response->body();

        if (empty($binaryData)) {
            return response()->json(['message' => 'Downloaded file is empty.'], 502);
        }

        $uuid = (string) Str::uuid();
        $mimeType = $response->header('Content-Type', 'application/octet-stream');
        $extension = $this->mimeToExtension($mimeType);
        $originalName = "{$uuid}.{$extension}";
        $path = $uuid . '/' . $originalName;

        $stored = Storage::disk('drive')->put($path, $binaryData);

        if (! $stored) {
            return response()->json(['message' => 'The file could not be saved. Please try again.'], 500);
        }

        $team = Team::firstOrCreate(
            ['slug' => 'automation'],
            ['name' => 'Automation', 'is_personal' => true],
        );

        $user = $request->has('user_id')
            ? User::findOrFail((int) $request->get('user_id'))
            : User::first();

        $file = File::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'uuid' => $uuid,
            'name' => $uuid,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size' => strlen($binaryData),
            'disk' => 'drive',
            'path' => $path,
            'is_public' => true,
            'post_type' => $request->input('post_type'),
        ]);

        return response()->json([
            'success' => true,
            'file' => $file->toArray(),
        ], 201);
    }

    private function mimeToExtension(string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'image/heic', 'image/heif' => 'heic',
            'video/mp4' => 'mp4',
            'video/quicktime' => 'mov',
            default => 'bin',
        };
    }
}
