<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstagramController extends Controller
{
    public function edit(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        return Inertia::render('settings/instagram', [
            'instagram' => [
                'node' => $team?->instagram_node,
                'access_token' => $team?->instagram_access_token ? '********' : null,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'node' => ['nullable', 'string', 'max:255'],
            'access_token' => ['nullable', 'string', 'max:2000'],
        ]);

        $team = $request->user()->currentTeam;

        $update = [
            'instagram_node' => $data['node'] ?: null,
        ];

        if ($data['access_token']) {
            $update['instagram_access_token'] = $data['access_token'];
        }

        $team?->update($update);

        return back()->with('status', 'Instagram configuration saved.');
    }
}
