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
        Schema::create('casualties', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->integer('age')->nullable();
            $table->string('sex')->nullable();
            $table->string('address')->nullable();
            $table->string('cause_of_death')->nullable();
            $table->date('date_died')->nullable();
            $table->string('place_of_incident')->nullable();

            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('casualties');
    }
};
