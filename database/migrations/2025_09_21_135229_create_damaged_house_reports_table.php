<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('damaged_house_reports', function (Blueprint $table) {
            $table->id();
            $table->string('barangay')->nullable();
            $table->unsignedInteger('partially')->nullable()->default(0);
            $table->unsignedInteger('totally')->nullable()->default(0);
            $table->unsignedInteger('total')->nullable()->default(0);
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
        Schema::dropIfExists('damaged_house_reports');
    }
};
