<?php

use App\Http\Controllers\Api\FileUploadController;
use Illuminate\Support\Facades\Route;

Route::post('upload', [FileUploadController::class, 'upload'])->name('api.upload');
