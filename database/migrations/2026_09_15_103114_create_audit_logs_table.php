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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // created, updated, deleted, login, logout, exported, etc.
            $table->string('auditable_type')->nullable(); // Model class name (e.g., App\Models\WeatherReport)
            $table->unsignedBigInteger('auditable_id')->nullable(); // ID of the model
            $table->json('old_values')->nullable(); // Before values (for updates/deletes)
            $table->json('new_values')->nullable(); // After values (for creates/updates)
            $table->string('ip_address', 45)->nullable(); // IPv4 or IPv6
            $table->text('user_agent')->nullable(); // Browser/device information
            $table->foreignId('disaster_id')->nullable()->constrained('disasters')->onDelete('set null');
            $table->text('description')->nullable(); // Optional description of the action
            $table->timestamps();

            // Indexes for better query performance
            $table->index(['user_id', 'created_at']);
            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['action', 'created_at']);
            $table->index('disaster_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
