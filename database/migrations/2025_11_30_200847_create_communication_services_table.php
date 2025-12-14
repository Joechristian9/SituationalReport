<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_services', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "TM", "DITO", "Sky Cable" - for additional services only
            $table->enum('category', ['cellphone', 'internet', 'radio']); // Service category
            $table->integer('order')->default(0); // Display order
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Note: GLOBE, SMART, POLARIS, and VHF are hardcoded default columns in the form
        // This table is only for additional/dynamic services that users want to add
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_services');
    }
};
