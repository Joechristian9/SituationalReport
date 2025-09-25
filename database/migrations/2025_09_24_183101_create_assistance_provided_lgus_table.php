<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistance_provided_lgus', function (Blueprint $table) {
            $table->id();
            $table->string('province')->nullable();
            $table->string('city')->nullable(); // city/communities
            $table->string('barangay')->nullable();
            $table->string('families_affected')->nullable();
            $table->string('families_assisted')->nullable();
            $table->string('cluster_type')->nullable();
            $table->string('quantity')->nullable();
            $table->string('unit')->nullable();
            $table->decimal('cost_per_unit', 12, 2)->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('source')->nullable();
            $table->text('remarks')->nullable();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistance_provided_lgus');
    }
};
