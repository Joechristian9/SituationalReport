<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_services', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "GLOBE", "SMART", "TM", "POLARIS", "VHF"
            $table->enum('category', ['cellphone', 'internet', 'radio']); // Service category
            $table->integer('order')->default(0); // Display order
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default services
        DB::table('communication_services')->insert([
            ['name' => 'GLOBE', 'category' => 'cellphone', 'order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'SMART', 'category' => 'cellphone', 'order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'POLARIS', 'category' => 'internet', 'order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'VHF', 'category' => 'radio', 'order' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_services');
    }
};
