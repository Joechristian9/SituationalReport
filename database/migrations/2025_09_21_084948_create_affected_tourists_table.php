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
        Schema::create('affected_tourists', function (Blueprint $table) {
            $table->id(); // Primary key

            $table->string('province_city_municipality')->nullable();
            $table->string('location')->nullable();

            // Using unsigned integers for counts that cannot be negative.
            $table->unsignedInteger('local_tourists')->nullable();
            $table->unsignedInteger('foreign_tourists')->nullable();

            $table->text('remarks')->nullable(); // Using text for potentially long remarks

            // Foreign keys for tracking who created and updated the record
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            // Timestamps for created_at and updated_at
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affected_tourists');
    }
};
