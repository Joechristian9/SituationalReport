<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_service_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('communication_id')->constrained('communications')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('communication_services')->onDelete('cascade');
            $table->string('status')->nullable(); // e.g., "Serviceable", "Not working", "Functional"
            $table->timestamps();
            
            // Ensure unique combination of communication_id and service_id
            $table->unique(['communication_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_service_values');
    }
};
