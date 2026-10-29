<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Preparing phones for offline sign-in was removed, so the offline password checks it kept
 * (2026_10_30_000000) are deleted rather than left in the table unused.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['offline_salt', 'offline_hash']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('offline_salt', 32)->nullable()->after('password');
            $table->string('offline_hash', 64)->nullable()->after('offline_salt');
        });
    }
};
