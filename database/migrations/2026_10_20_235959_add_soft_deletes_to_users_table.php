<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deleting an account used to delete every report it filed (and, for an admin, every
 * disaster it created). Accounts are now soft-deleted: they can't log in, but stay as
 * the author of what they filed.
 *
 * Dated before the 2026_10_21/22 migrations on purpose: they query through the User model,
 * which now expects deleted_at, so on a fresh database the column must exist first.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
