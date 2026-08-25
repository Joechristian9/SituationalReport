<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Rename the main table if it hasn't been renamed yet
        if (Schema::hasTable('typhoons') && !Schema::hasTable('disasters')) {
            Schema::rename('typhoons', 'disasters');
        } elseif (!Schema::hasTable('typhoons') && !Schema::hasTable('disasters')) {
            throw new \Exception('Neither typhoons nor disasters table exists!');
        }
        // If disasters table exists, we assume the rename already happened

        // Step 2: Get all tables that have typhoon_id column
        $tables = [
            'weather_reports',
            'water_levels',
            'electricity_services',
            'water_services',
            'communications',
            'roads',
            'bridges',
            'pre_emptive_reports',
            'incident_monitored',
            'casualties',
            'injureds',
            'missing',
            'pre_positionings',
            'usc_declarations',
            'damaged_house_reports',
            'affected_tourists',
            'response_operations',
            'assistance_extendeds',
            'assistance_provided_lgus',
            'suspension_of_classes',
            'suspension_of_works',
            'agriculture_reports',
        ];

        // Step 3: For each table, drop the foreign key, rename the column, and recreate the foreign key
        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'typhoon_id')) {
                // Get the actual foreign key name from the database
                $foreignKeys = DB::select("
                    SELECT CONSTRAINT_NAME 
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = '{$table}' 
                    AND COLUMN_NAME = 'typhoon_id' 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ");

                // Drop the existing foreign key constraint if it exists
                if (!empty($foreignKeys)) {
                    Schema::table($table, function (Blueprint $blueprint) use ($foreignKeys) {
                        $blueprint->dropForeign($foreignKeys[0]->CONSTRAINT_NAME);
                    });
                }

                // Rename the column
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->renameColumn('typhoon_id', 'disaster_id');
                });

                // Add the new foreign key constraint
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->foreign('disaster_id')->references('id')->on('disasters')->onDelete('cascade');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Get all tables that have disaster_id column
        $tables = [
            'weather_reports',
            'water_levels',
            'electricity_services',
            'water_services',
            'communications',
            'roads',
            'bridges',
            'pre_emptive_reports',
            'incident_monitored',
            'casualties',
            'injureds',
            'missing',
            'pre_positionings',
            'usc_declarations',
            'damaged_house_reports',
            'affected_tourists',
            'response_operations',
            'assistance_extendeds',
            'assistance_provided_lgus',
            'suspension_of_classes',
            'suspension_of_works',
            'agriculture_reports',
        ];

        // Step 2: For each table, drop the foreign key, rename the column back, and recreate the foreign key
        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'disaster_id')) {
                // Get the actual foreign key name from the database
                $foreignKeys = DB::select("
                    SELECT CONSTRAINT_NAME 
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = '{$table}' 
                    AND COLUMN_NAME = 'disaster_id' 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ");

                // Drop the disaster_id foreign key if it exists
                if (!empty($foreignKeys)) {
                    Schema::table($table, function (Blueprint $blueprint) use ($foreignKeys) {
                        $blueprint->dropForeign($foreignKeys[0]->CONSTRAINT_NAME);
                    });
                }

                // Rename the column back
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->renameColumn('disaster_id', 'typhoon_id');
                });

                // Add the typhoon_id foreign key back
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->foreign('typhoon_id')->references('id')->on('typhoons')->onDelete('cascade');
                });
            }
        }

        // Step 3: Rename the table back
        Schema::rename('disasters', 'typhoons');
    }
};
