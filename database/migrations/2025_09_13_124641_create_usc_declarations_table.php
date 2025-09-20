<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('usc_declarations', function (Blueprint $table) {
            $table->id();
            $table->string('declared_by')->nullable();
            $table->string('resolution_number')->nullable();
            $table->date('date_approved')->nullable();

            // Track creator & updater
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usc_declarations');
    }
};
