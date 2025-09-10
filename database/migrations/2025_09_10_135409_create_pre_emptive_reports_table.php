<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_emptive_reports', function (Blueprint $table) {
            $table->id();
            $table->string('barangay')->nullable();
            $table->string('evacuation_center')->nullable();
            $table->integer('families')->nullable()->default(0); // inside EC
            $table->integer('persons')->nullable()->default(0);  // inside EC
            $table->string('outside_center')->nullable();
            $table->integer('outside_families')->nullable()->default(0);
            $table->integer('outside_persons')->nullable()->default(0);
            $table->integer('total_families')->nullable()->default(0);
            $table->integer('total_persons')->nullable()->default(0);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_emptive_reports');
    }
};
