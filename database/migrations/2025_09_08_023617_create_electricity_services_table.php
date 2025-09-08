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
        Schema::create('electricity_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade'); // when user is deleted, records are removed

            $table->string('status')->nullable(); // Operational / Partial / Outage
            $table->text('barangays_affected')->nullable(); // list of affected barangays

            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('remarks')->nullable(); // extra notes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('electricity_services');
    }
};
