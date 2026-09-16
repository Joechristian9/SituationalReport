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
        Schema::table('bridges', function (Blueprint $table) {
            // Change status from ENUM to string to allow free-text input
            $table->string('status')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bridges', function (Blueprint $table) {
            // Revert back to ENUM
            $table->enum('status', ['Passable', 'Not Passable'])->default('Passable')->nullable()->change();
        });
    }
};
