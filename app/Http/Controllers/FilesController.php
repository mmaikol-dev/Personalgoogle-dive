<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FilesController extends Controller
{
    public function index(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        $query = File::where('team_id', $team->id);

        if ($search = $request->get('search')) {
            $query->where('original_name', 'like', "%{$search}%");
        }

        if ($folder = $request->get('folder')) {
            $query->where('folder', $folder);
        }

        if ($tag = $request->get('tag')) {
            $query->whereJsonContains('tags', $tag);
        }

        $sortField = $request->get('sort', 'created_at');
        $sortDir = $request->get('dir', 'desc');
        $query->orderBy($sortField, $sortDir);

        $files = $query->paginate(20)->through(fn (File $file) => $file->toArray());

        $folders = File::where('team_id', $team->id)
            ->whereNotNull('folder')
            ->distinct()
            ->pluck('folder')
            ->filter()
            ->values();

        $allTags = File::where('team_id', $team->id)
            ->whereNotNull('tags')
            ->get()
            ->flatMap(fn (File $file) => $file->tags ?? [])
            ->unique()
            ->values();

        return Inertia::render('files', [
            'files' => $files,
            'folders' => $folders,
            'allTags' => $allTags,
            'filters' => $request->only(['search', 'folder', 'tag', 'sort', 'dir']),
            'chartData' => File::where('team_id', $team->id)
                ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as date"), DB::raw('count(*) as count'))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:102400'],
            'folder' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $team = $request->user()->currentTeam;
        $uploaded = $request->file('file');
        $uuid = (string) Str::uuid();
        $originalName = $uploaded->getClientOriginalName();
        $path = $uploaded->storeAs($uuid, $originalName, 'drive');

        if ($path === false) {
            return back()->withErrors(['file' => 'The file could not be saved. Please try again.']);
        }

        File::create([
            'team_id' => $team->id,
            'user_id' => $request->user()->id,
            'uuid' => $uuid,
            'name' => $uuid,
            'original_name' => $originalName,
            'mime_type' => $uploaded->getMimeType(),
            'size' => $uploaded->getSize(),
            'disk' => 'drive',
            'path' => $path,
            'folder' => $request->get('folder'),
            'tags' => $request->get('tags'),
        ]);

        return redirect()->back();
    }

    public function update(Request $request, string $current_team, string $fileId): RedirectResponse
    {
        $file = $this->findFileOrFail($fileId);

        $validated = $request->validate([
            'expires_at' => ['nullable', 'integer', 'in:0,24,168,720'],
            'password' => ['nullable', 'string', 'min:4', 'max:255'],
            'max_downloads' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'slug' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9\-]+$/i', 'unique:files,slug,'.$fileId],
            'folder' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $data = [];

        if ($request->has('expires_at')) {
            $hours = (int) $request->get('expires_at');
            $data['expires_at'] = $hours > 0 ? now()->addHours($hours) : null;
        }

        if ($request->has('password')) {
            $password = $request->get('password');
            $data['password_hash'] = $password ? Hash::make($password) : null;
        }

        if ($request->has('max_downloads')) {
            $data['max_downloads'] = $request->get('max_downloads');
        }

        if ($request->has('slug')) {
            $data['slug'] = $request->get('slug') ?: null;
        }

        if ($request->has('folder')) {
            $data['folder'] = $request->get('folder') ?: null;
        }

        if ($request->has('tags')) {
            $data['tags'] = $request->get('tags');
        }

        $file->update($data);

        return redirect()->back();
    }

    public function revoke(string $current_team, string $fileId): RedirectResponse
    {
        $file = $this->findFileOrFail($fileId);
        $file->update(['revoked_at' => now()]);

        return redirect()->back();
    }

    public function unrevoke(string $current_team, string $fileId): RedirectResponse
    {
        $file = $this->findFileOrFail($fileId);
        $file->update(['revoked_at' => null]);

        return redirect()->back();
    }

    public function destroy(Request $request, string $current_team, string $fileId): RedirectResponse
    {
        $file = $this->findFileOrFail($fileId);

        Storage::disk($file->disk)->deleteDirectory(dirname($file->path));
        $file->delete();

        return redirect()->back();
    }

    public function batchDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:files,id'],
        ]);

        $files = File::whereIn('id', $request->get('ids'))->get();

        foreach ($files as $file) {
            Storage::disk($file->disk)->deleteDirectory(dirname($file->path));
            $file->delete();
        }

        return redirect()->back();
    }

    public function download(string $current_team, string $fileId)
    {
        $file = $this->findFileOrFail($fileId);

        if (! Storage::disk($file->disk)->exists($file->path)) {
            abort(404, 'File not found on disk');
        }

        return Storage::disk($file->disk)->download($file->path, $file->original_name, [
            'Content-Type' => $file->mime_type,
        ]);
    }

    public function preview(string $current_team, string $fileId)
    {
        $file = $this->findFileOrFail($fileId);

        if (! str($file->mime_type)->startsWith(['image/', 'application/pdf'])) {
            return response()->json(['error' => 'mime_check_failed', 'mime' => $file->mime_type], 404);
        }

        $disk = Storage::disk($file->disk);
        $exists = $disk->exists($file->path);

        if (! $exists) {
            return response()->json([
                'error' => 'file_not_on_disk',
                'path' => $file->path,
                'full_path' => $disk->path($file->path),
                'disk_root' => $disk->getConfig()['root'] ?? 'unknown',
                'file_exists' => file_exists($disk->path($file->path)),
                'dir_readable' => is_readable(dirname($disk->path($file->path))),
            ], 404);
        }

        return Storage::disk($file->disk)->response($file->path, null, [
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => 'inline; filename="'.$file->original_name.'"',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    private function findFileOrFail(string $fileId): File
    {
        $file = File::find($fileId);

        abort_unless($file, 404);

        return $file;
    }
}
