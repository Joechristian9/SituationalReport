<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roads', function (Blueprint $table) {
            $table->id();
            $table->string('road_classification')->nullable();
            $table->string('name_of_road');
            $table->string('status')->nullable(); // e.g., Open, Closed, Passable
            $table->string('areas_affected')->nullable();
            $table->string('re_routing')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roads');
    }
};
