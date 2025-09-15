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
        Schema::create('incident_monitored', function (Blueprint $table) {
            $table->id();
            $table->string('kinds_of_incident')->nullable();
            $table->dateTime('date_time')->nullable();
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->text('remarks')->nullable();

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
        Schema::dropIfExists('incident_monitored');
    }
};
