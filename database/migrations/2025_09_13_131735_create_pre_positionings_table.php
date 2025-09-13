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
        Schema::create('pre_positionings', function (Blueprint $table) {
            $table->id();
            $table->string('team_units')->nullable();
            $table->string('team_leader')->nullable();
            $table->integer('personnel_deployed')->nullable();
            $table->string('response_assets')->nullable();
            $table->string('capability')->nullable();
            $table->string('area_of_deployment')->nullable();
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
        Schema::dropIfExists('pre_positionings');
    }
};
