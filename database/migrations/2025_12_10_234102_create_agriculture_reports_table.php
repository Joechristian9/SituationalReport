<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agriculture_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('typhoon_id')->constrained()->onDelete('cascade');
            $table->string('crops_affected'); // e.g., "RICE", "CORN", "HVCC"
            $table->decimal('standing_crop_ha', 10, 2)->nullable(); // Standing Crop (Ha)
            $table->string('stage_of_crop')->nullable(); // Stage of crop
            $table->decimal('total_area_affected_ha', 10, 2)->nullable(); // Total Area Affected (Ha)
            $table->decimal('total_production_loss', 15, 2)->nullable(); // Total Production Loss
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agriculture_reports');
    }
};
