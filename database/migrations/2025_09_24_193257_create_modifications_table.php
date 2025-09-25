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
        Schema::create('modifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            $table->string('model_type');       // e.g., "WeatherReport"
            $table->unsignedBigInteger('model_id');
            $table->string('action', 50);       // "created", "updated", "deleted"

            $table->json('changed_fields')->nullable(); // old/new values for updates
            $table->text('remarks')->nullable();        // optional

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modifications');
    }
};
