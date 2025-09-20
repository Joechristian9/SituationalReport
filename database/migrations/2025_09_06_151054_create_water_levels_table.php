<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('water_levels', function (Blueprint $table) {
            $table->id();
            $table->string('gauging_station')->nullable();
            $table->decimal('current_level', 8, 2)->nullable();
            $table->decimal('alarm_level', 8, 2)->nullable();
            $table->decimal('critical_level', 8, 2)->nullable();
            $table->string('affected_areas')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('water_levels');
    }
};
