<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->string('instagram_node')->nullable()->after('google_sheet_name');
            $table->text('instagram_access_token')->nullable()->after('instagram_node');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['instagram_node', 'instagram_access_token']);
        });
    }
};
