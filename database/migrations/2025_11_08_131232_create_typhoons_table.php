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
        Schema::create('typhoons', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Typhoon name (e.g., "Kristine", "Leon")
            $table->text('description')->nullable(); // Additional details
            $table->enum('status', ['active', 'paused', 'ended'])->default('active');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('resumed_at')->nullable();
            $table->string('pdf_path')->nullable(); // Auto-generated PDF path when ended
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('ended_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('paused_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('resumed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('typhoons');
    }
};
