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
        Schema::create('suspension_of_classes', function (Blueprint $table) {
            $table->id();

            $table->string('province_city_municipality')->nullable();
            $table->enum('level', [
                'Pre-school',
                'Elementary',
                'Junior High School',
                'Senior High School',
                'All Levels (K-12)',
                'College',
                'All Levels (including College)',
            ])->nullable();
            $table->date('date_of_suspension')->nullable();
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
        Schema::dropIfExists('suspension_of_classes');
    }
};
