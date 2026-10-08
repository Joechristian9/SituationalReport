<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AgricultureReport sets user_id and updated_by when it is saved (like every other
 * report), but the table never had these columns, so every agriculture save failed.
 * Nullable: rows saved before this have no recorded creator.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agriculture_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('agriculture_reports', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('disaster_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('agriculture_reports', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('agriculture_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('updated_by');
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
