<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BulkDownloadController extends Controller
{
    public function download(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:files,id'],
        ]);

        $files = File::whereIn('id', $request->get('ids'))->get();

        if ($files->isEmpty()) {
            abort(404);
        }

        $zipName = 'files-'.now()->format('Y-m-d-His').'.zip';
        $zipPath = Storage::disk('local')->path("temp/{$zipName}");

        Storage::disk('local')->makeDirectory('temp');

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            abort(500, 'Could not create zip archive');
        }

        foreach ($files as $file) {
            $filePath = Storage::disk($file->disk)->path($file->path);

            if (file_exists($filePath)) {
                $zip->addFile($filePath, $file->original_name);
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipName)->deleteFileAfterSend(true);
    }
}
