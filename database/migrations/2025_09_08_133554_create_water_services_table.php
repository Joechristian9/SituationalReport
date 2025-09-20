<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('water_services', function (Blueprint $table) {
            $table->id();
            $table->string('source_of_water')->nullable();
            $table->text('barangays_served')->nullable();
            $table->enum('status', ['functional', 'available', 'not_available'])->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('water_services');
    }
};
