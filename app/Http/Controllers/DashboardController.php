<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\TeamInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $email = strtolower($request->user()->email);
        $team = $request->user()->currentTeam;

        $pendingInvitations = TeamInvitation::query()
            ->with(['inviter', 'team'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (TeamInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'team' => [
                    'name' => $invitation->team->name,
                    'slug' => $invitation->team->slug,
                ],
            ]);

        $filesQuery = File::where('team_id', $team->id);

        $stats = [
            'totalFiles' => (clone $filesQuery)->count(),
            'totalSize' => (clone $filesQuery)->sum('size'),
            'totalDownloads' => (clone $filesQuery)->sum('download_count'),
            'publicFiles' => (clone $filesQuery)->whereNull('revoked_at')->count(),
            'passwordProtected' => (clone $filesQuery)->whereNotNull('password_hash')->count(),
            'revokedFiles' => (clone $filesQuery)->whereNotNull('revoked_at')->count(),
        ];

        $stats['totalSize'] = $this->formatBytes($stats['totalSize']);

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'stats' => $stats,
            'chartData' => File::where('team_id', $team->id)
                ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as date"), DB::raw('count(*) as count'))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ]);
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes >= 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }
}
