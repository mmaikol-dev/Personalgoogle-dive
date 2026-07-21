<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('is_public');
            $table->string('password_hash')->nullable()->after('expires_at');
            $table->unsignedInteger('max_downloads')->nullable()->after('password_hash');
            $table->unsignedInteger('download_count')->default(0)->after('max_downloads');
            $table->string('slug')->nullable()->unique()->after('download_count');
            $table->timestamp('revoked_at')->nullable()->after('slug');
            $table->string('folder')->nullable()->after('path');
            $table->json('tags')->nullable()->after('folder');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropColumn(['expires_at', 'password_hash', 'max_downloads', 'download_count', 'slug', 'revoked_at', 'folder', 'tags']);
        });
    }
};
