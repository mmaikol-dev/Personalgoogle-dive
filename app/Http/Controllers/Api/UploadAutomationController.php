<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'file' => ['required', 'file', 'max:102400'],
            'post_type' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $uploaded = $request->file('file');
        $uuid = (string) Str::uuid();
        $originalName = $uploaded->getClientOriginalName();
        $path = $uploaded->storeAs($uuid, $originalName, 'drive');

        if ($path === false) {
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
            'mime_type' => $uploaded->getMimeType(),
            'size' => $uploaded->getSize(),
            'disk' => 'drive',
            'path' => $path,
            'is_public' => true,
            'post_type' => $request->get('post_type'),
        ]);

        return response()->json([
            'success' => true,
            'file' => $file->toArray(),
        ], 201);
    }
}
