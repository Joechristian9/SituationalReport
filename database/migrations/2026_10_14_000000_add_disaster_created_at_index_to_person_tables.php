<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The dead / injured / missing lists, the dashboard and the impact stats all read
 * "this disaster, newest first". One index serves that filter and that order.
 */
return new class extends Migration
{
    private const TABLES = ['casualties', 'injureds', 'missing'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->index(['disaster_id', 'created_at'], "{$table}_disaster_created_at_index");
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropIndex("{$table}_disaster_created_at_index");
            });
        }
    }
};
