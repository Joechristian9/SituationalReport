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
        Schema::create('assistance_extendeds', function (Blueprint $table) {
            $table->id();
            $table->string('agency_officials_groups')->nullable();
            $table->string('type_kind_of_assistance')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('beneficiaries')->nullable();

            // Track creator & updater
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            // ✅ Only one timestamps call
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assistance_extendeds');
    }
};
