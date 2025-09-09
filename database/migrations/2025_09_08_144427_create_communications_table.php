// database/migrations/2025_09_08_000000_create_communications_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->string('globe')->nullable();
            $table->string('smart')->nullable();
            $table->string('pldt_landline')->nullable();
            $table->string('pldt_internet')->nullable();
            $table->string('vhf')->nullable();
            $table->text('remarks')->nullable();

            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
