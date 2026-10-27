<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * These keys cascaded, so a real delete of a user wiped their reports, their edit history
 * and every disaster they created (with all its reports). Users are soft-deleted now;
 * RESTRICT makes any real delete fail instead of taking that data with it.
 */
return new class extends Migration
{
    private const KEYS = [
        'affected_tourists' => 'user_id',
        'assistance_extendeds' => 'user_id',
        'assistance_provided_lgus' => 'user_id',
        'bridges' => 'user_id',
        'casualties' => 'user_id',
        'communications' => 'user_id',
        'damaged_house_reports' => 'user_id',
        'electricity_services' => 'user_id',
        'incident_monitored' => 'user_id',
        'injureds' => 'user_id',
        'missing' => 'user_id',
        'pre_emptive_reports' => 'user_id',
        'pre_positionings' => 'user_id',
        'response_operations' => 'user_id',
        'roads' => 'user_id',
        'suspension_of_classes' => 'user_id',
        'usc_declarations' => 'user_id',
        'water_levels' => 'user_id',
        'water_services' => 'user_id',
        'weather_reports' => 'user_id',
        'modifications' => 'user_id',
        'disasters' => 'created_by',
    ];

    public function up(): void
    {
        $this->setOnDelete('restrict');
    }

    public function down(): void
    {
        $this->setOnDelete('cascade');
    }

    private function setOnDelete(string $rule): void
    {
        foreach (self::KEYS as $table => $column) {
            // Real name on MySQL (disasters still has typhoons_* names); SQLite keys have none, so drop by column.
            $name = collect(Schema::getForeignKeys($table))->firstWhere('columns', [$column])['name'] ?? null;

            Schema::table($table, function (Blueprint $blueprint) use ($column, $name, $rule) {
                $blueprint->dropForeign($name ?: [$column]);
                $blueprint->foreign($column)->references('id')->on('users')->onDelete($rule);
            });
        }
    }
};
