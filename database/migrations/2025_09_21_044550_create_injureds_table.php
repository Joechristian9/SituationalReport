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
        // Creates the 'injured' table in the database.
        Schema::create('injured', function (Blueprint $table) {
            $table->id(); // Primary key

            // Profile Information
            $table->string('name')->nullable();
            $table->integer('age')->nullable();
            $table->string('sex')->nullable();
            $table->text('address')->nullable(); // Using text for potentially longer addresses

            // Medical and Incident Details
            $table->text('diagnosis')->nullable(); // Using text for potentially long diagnoses
            $table->date('date_admitted')->nullable();
            $table->string('place_of_incident')->nullable();
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
        // Drops the 'injured' table if the migration is rolled back.
        Schema::dropIfExists('injured');
    }
};
