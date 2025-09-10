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
        Schema::create('bridges', function (Blueprint $table) {
            $table->id();
            $table->string('road_classification')->nullable(); // e.g. National, Provincial
            $table->string('name_of_bridge');
            $table->enum('status', ['Passable', 'Not Passable'])->default('Passable');
            $table->string('areas_affected')->nullable(); // affected barangays
            $table->string('re_routing')->nullable(); // alternative routes
            $table->text('remarks')->nullable();

            // track who created/updated
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bridges');
    }
};
