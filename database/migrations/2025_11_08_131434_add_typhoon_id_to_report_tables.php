<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'weather_reports',
            'casualties',
            'injureds',
            'missing',
            'pre_emptive_reports',
            'incident_monitored',
            'pre_positionings',
            'usc_declarations',
            'damaged_house_reports',
            'affected_tourists',
            'response_operations',
            'assistance_extendeds',
            'assistance_provided_lgus',
            'suspension_of_classes',
            'suspension_of_works',
            'bridges',
            'roads',
            'water_levels',
            'communications',
            'electricity_services',
            'water_services',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('typhoon_id')->nullable()->after('id')->constrained('typhoons')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'weather_reports',
            'casualties',
            'injureds',
            'missing',
            'pre_emptive_reports',
            'incident_monitored',
            'pre_positionings',
            'usc_declarations',
            'damaged_house_reports',
            'affected_tourists',
            'response_operations',
            'assistance_extendeds',
            'assistance_provided_lgus',
            'suspension_of_classes',
            'suspension_of_works',
            'bridges',
            'roads',
            'water_levels',
            'communications',
            'electricity_services',
            'water_services',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['typhoon_id']);
                $blueprint->dropColumn('typhoon_id');
            });
        }
    }
};
