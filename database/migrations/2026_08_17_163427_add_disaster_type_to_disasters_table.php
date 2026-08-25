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
        Schema::table('disasters', function (Blueprint $table) {
            $table->enum('disaster_type', [
                'Typhoon',
                'Tropical Storm',
                'Tropical Depression',
                'Flood',
                'Flash Flood',
                'Earthquake',
                'Landslide',
                'Storm Surge',
                'Drought',
                'Volcanic Eruption',
                'Fire',
                'Tornado',
                'Heavy Rainfall',
                'Other'
            ])->after('name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('disasters', function (Blueprint $table) {
            $table->dropColumn('disaster_type');
        });
    }
};
