<?php

use App\Http\Controllers\BulkDownloadController;
use App\Http\Controllers\ChunkUploadController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FilesController;
use App\Http\Controllers\PublicShareController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('f/{token}')
    ->group(function () {
        Route::get('/{filename?}', [PublicShareController::class, 'show'])->name('share.show');
        Route::post('verify-password', [PublicShareController::class, 'verifyPassword'])->name('share.verify-password');
        Route::get('/', [PublicShareController::class, 'info'])->name('share.info');
    });

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::get('files', [FilesController::class, 'index'])->name('files.index');
        Route::post('files', [FilesController::class, 'store'])->name('files.store');
        Route::patch('files/{fileId}', [FilesController::class, 'update'])->name('files.update');
        Route::delete('files/{fileId}', [FilesController::class, 'destroy'])->name('files.destroy');
        Route::post('files/batch-delete', [FilesController::class, 'batchDestroy'])->name('files.batch-destroy');
        Route::post('files/{fileId}/revoke', [FilesController::class, 'revoke'])->name('files.revoke');
        Route::post('files/{fileId}/unrevoke', [FilesController::class, 'unrevoke'])->name('files.unrevoke');
        Route::get('files/{fileId}/preview', [FilesController::class, 'preview'])->name('files.preview');
        Route::get('files/{fileId}/download', [FilesController::class, 'download'])->name('files.download');

        Route::post('files/bulk-download', [BulkDownloadController::class, 'download'])->name('files.bulk-download');

        Route::post('upload/init', [ChunkUploadController::class, 'init'])->name('upload.init');
        Route::post('upload/chunk', [ChunkUploadController::class, 'chunk'])->name('upload.chunk');
        Route::post('upload/complete', [ChunkUploadController::class, 'complete'])->name('upload.complete');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
require __DIR__.'/api.php';
