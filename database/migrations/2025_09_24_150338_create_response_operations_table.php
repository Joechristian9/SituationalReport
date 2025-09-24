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
        Schema::create('response_operations', function (Blueprint $table) {
            $table->id();
            $table->string('team_unit')->nullable();
            $table->string('incident')->nullable();
            $table->dateTime('datetime')->nullable();
            $table->string('location')->nullable();
            $table->text('actions')->nullable();
            $table->text('remarks')->nullable();

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
        Schema::dropIfExists('response_operations');
    }
};
