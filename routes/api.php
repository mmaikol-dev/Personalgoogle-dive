<?php

use App\Http\Controllers\Api\FileUploadController;
use App\Http\Controllers\Api\UploadAutomationController;
use Illuminate\Support\Facades\Route;

Route::post('upload', [FileUploadController::class, 'upload'])->name('api.upload');
Route::post('upload-automation', [UploadAutomationController::class, 'upload'])->name('api.upload-automation');
