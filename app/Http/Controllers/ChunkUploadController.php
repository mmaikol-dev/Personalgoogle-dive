<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Services\GoogleSheetsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChunkUploadController extends Controller
{
    public function init(Request $request): JsonResponse
    {
        $request->validate([
            'original_name' => ['required', 'string', 'max:255'],
            'total_size' => ['required', 'integer', 'min:1', 'max:1073741824'],
            'total_chunks' => ['required', 'integer', 'min:1', 'max:10000'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'google_sheet_name' => ['nullable', 'string', 'max:100'],
            'post_type' => ['nullable', 'string', 'max:50'],
        ]);

        $uploadId = (string) Str::uuid();

        Storage::disk('drive')->makeDirectory("chunks/{$uploadId}");

        cache()->put("upload:{$uploadId}", [
            'original_name' => $request->get('original_name'),
            'total_size' => (int) $request->get('total_size'),
            'total_chunks' => (int) $request->get('total_chunks'),
            'received' => [],
            'caption' => $request->string('caption')->toString(),
            'google_sheet_name' => $request->string('google_sheet_name')->toString(),
            'post_type' => $request->string('post_type')->toString(),
            'created_at' => now(),
        ], now()->addHours(2));

        return response()->json([
            'upload_id' => $uploadId,
            'expires_in' => 7200,
        ]);
    }

    public function chunk(Request $request): JsonResponse
    {
        $request->validate([
            'upload_id' => ['required', 'string', 'uuid'],
            'chunk_index' => ['required', 'integer', 'min:0'],
            'file' => ['required', 'file', 'max:52428800'],
        ]);

        $uploadId = $request->get('upload_id');
        $upload = cache()->get("upload:{$uploadId}");

        if (! $upload) {
            return response()->json(['message' => 'Upload session expired or invalid.'], 410);
        }

        $chunkIndex = (int) $request->get('chunk_index');

        $path = $request->file('file')->storeAs("chunks/{$uploadId}", "{$chunkIndex}.part", 'drive');

        if ($path === false) {
            return response()->json(['message' => 'The upload chunk could not be saved. Please retry it.'], 500);
        }

        $upload['received'][] = $chunkIndex;
        $upload['received'] = array_unique($upload['received']);
        cache()->put("upload:{$uploadId}", $upload, now()->addHours(2));

        $isDone = count($upload['received']) === $upload['total_chunks'];

        return response()->json([
            'received_index' => $chunkIndex,
            'done' => $isDone,
            'received_count' => count($upload['received']),
            'total_chunks' => $upload['total_chunks'],
        ]);
    }

    public function complete(Request $request): JsonResponse
    {
        $request->validate([
            'upload_id' => ['required', 'string', 'uuid'],
            'folder' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $uploadId = $request->get('upload_id');
        $upload = cache()->pull("upload:{$uploadId}");

        if (! $upload) {
            return response()->json(['message' => 'Upload session expired or invalid.'], 410);
        }

        if (count($upload['received']) !== $upload['total_chunks']) {
            cache()->put("upload:{$uploadId}", $upload, now()->addHours(2));

            return response()->json([
                'message' => 'Not all chunks have been received.',
                'received' => count($upload['received']),
                'total' => $upload['total_chunks'],
            ], 400);
        }

        $uuid = (string) Str::uuid();
        $originalName = $upload['original_name'];
        $finalDir = $uuid;
        $finalPath = "{$finalDir}/{$originalName}";

        $disk = Storage::disk('drive');
        $disk->makeDirectory($finalDir);

        $finalHandle = fopen($disk->path($finalPath), 'wb');

        for ($i = 0; $i < $upload['total_chunks']; $i++) {
            $chunkPath = $disk->path("chunks/{$uploadId}/{$i}.part");

            if (! is_file($chunkPath)) {
                fclose($finalHandle);
                $disk->delete($finalPath);
                cache()->put("upload:{$uploadId}", $upload, now()->addHours(2));

                return response()->json(['message' => 'An upload chunk is missing. Please retry the upload.'], 400);
            }

            $chunkHandle = fopen($chunkPath, 'rb');
            stream_copy_to_stream($chunkHandle, $finalHandle);
            fclose($chunkHandle);
            unlink($chunkPath);
        }

        fclose($finalHandle);

        $disk->deleteDirectory("chunks/{$uploadId}");

        $mimeType = mime_content_type($disk->path($finalPath)) ?: 'application/octet-stream';

        $file = File::create([
            'team_id' => $request->user()->currentTeam->id,
            'user_id' => $request->user()->id,
            'uuid' => $uuid,
            'name' => $uuid,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size' => $upload['total_size'],
            'disk' => 'drive',
            'path' => $finalPath,
            'folder' => $request->get('folder'),
            'tags' => $request->get('tags'),
            'post_type' => $upload['post_type'] ?: null,
        ]);

        $googleSheetsSynced = false;

        try {
            $googleSheetsSynced = app(GoogleSheetsService::class)->appendUpload(
                $request->user()->currentTeam,
                $file,
                $upload['caption'] ?? null,
                $upload['google_sheet_name'] ?? null,
            );
        } catch (\Throwable $exception) {
            Log::error('Unable to append chunk upload to Google Sheets.', [
                'file_id' => $file->id,
                'exception' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'file' => $file->toArray(),
            'google_sheets_synced' => $googleSheetsSynced,
        ]);
    }
}
