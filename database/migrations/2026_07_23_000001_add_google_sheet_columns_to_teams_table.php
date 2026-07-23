<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->string('google_sheet_id')->nullable()->after('is_personal');
            $table->string('google_sheet_name')->nullable()->after('google_sheet_id');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['google_sheet_id', 'google_sheet_name']);
        });
    }
};
