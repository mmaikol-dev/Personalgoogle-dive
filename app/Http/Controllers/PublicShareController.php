<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class PublicShareController extends Controller
{
    public function show(Request $request, string $token, ?string $filename = null)
    {
        $file = File::where(function ($query) use ($token) {
            $query->where('uuid', $token)->orWhere('slug', $token);
        })->firstOrFail();

        if (! $file->is_accessible) {
            if ($file->is_expired) {
                abort(410, 'This link has expired.');
            }

            if ($file->is_revoked) {
                abort(410, 'This link has been revoked.');
            }

            if ($file->is_download_limit_reached) {
                abort(410, 'Download limit reached.');
            }
        }

        if ($file->is_password_protected) {
            if (! $request->hasCookie('file_access_'.$file->id)) {
                return inertia('public/password', [
                    'token' => $token,
                    'fileId' => $file->id,
                    'fileName' => $file->original_name,
                ]);
            }
        }

        $file->increment('download_count');

        $path = Storage::disk($file->disk)->path($file->path);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => 'inline; filename="'.$file->original_name.'"',
        ]);
    }

    public function verifyPassword(Request $request)
    {
        $request->validate([
            'file_id' => ['required', 'integer', 'exists:files,id'],
            'password' => ['required', 'string'],
        ]);

        $file = File::findOrFail($request->get('file_id'));

        if (! $file->password_hash || ! Hash::check($request->get('password'), $file->password_hash)) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        return redirect()->to($file->share_url)
            ->withCookie(cookie('file_access_'.$file->id, 'granted', 60 * 24));
    }

    public function info(string $token)
    {
        $file = File::where(function ($query) use ($token) {
            $query->where('uuid', $token)->orWhere('slug', $token);
        })->firstOrFail();

        return response()->json([
            'name' => $file->original_name,
            'size' => $file->getSizeForHumans(),
            'mime_type' => $file->mime_type,
            'is_password_protected' => $file->is_password_protected,
            'is_accessible' => $file->is_accessible,
        ]);
    }
}
