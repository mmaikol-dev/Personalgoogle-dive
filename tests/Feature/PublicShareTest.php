<?php

use App\Models\File;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('a shared URL resolves the file matching both its slug and filename', function () {
    Storage::fake('public');

    $team = Team::factory()->create();
    $user = User::factory()->create();

    $first = File::factory()->create([
        'team_id' => $team->id,
        'user_id' => $user->id,
        'slug' => 'gallery',
        'original_name' => 'first.png',
        'disk' => 'public',
        'path' => 'files/first.png',
        'mime_type' => 'image/png',
        'is_public' => true,
    ]);

    $second = File::factory()->create([
        'team_id' => $team->id,
        'user_id' => $user->id,
        'slug' => 'gallery',
        'original_name' => 'second.png',
        'disk' => 'public',
        'path' => 'files/second.png',
        'mime_type' => 'image/png',
        'is_public' => true,
    ]);

    Storage::disk('public')->put($first->path, 'first');
    Storage::disk('public')->put($second->path, 'second');

    $this->get('/f/gallery/second.png')
        ->assertOk()
        ->assertHeader('content-disposition', 'inline; filename="second.png"');
});

test('a custom slug is used in a file share URL', function () {
    $file = File::factory()->create([
        'slug' => 'gallery',
        'original_name' => 'photo.png',
    ]);

    expect($file->share_url)->toEndWith('/f/gallery/photo.png');
});
