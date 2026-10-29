<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The check a prepared phone uses to sign an account in with no internet (User::rememberOfflinePassword).
 * Empty until the server next sees the account's password: at sign-in, or when it is set or changed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('offline_salt', 32)->nullable()->after('password');
            $table->string('offline_hash', 64)->nullable()->after('offline_salt');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['offline_salt', 'offline_hash']);
        });
    }
};
