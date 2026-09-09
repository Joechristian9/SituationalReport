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
        Schema::create('user_data_sharing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Data owner
            $table->foreignId('shared_with_user_id')->constrained('users')->onDelete('cascade'); // Who can access
            $table->enum('permission_type', ['read', 'write'])->default('read'); // read or write access
            $table->timestamps();
            
            // Ensure no duplicate sharing entries
            $table->unique(['user_id', 'shared_with_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_data_sharing');
    }
};
