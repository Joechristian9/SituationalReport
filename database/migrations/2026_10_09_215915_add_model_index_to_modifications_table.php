<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every form loads its edit history by model type and record id; without this
     * index each load scans the whole table.
     */
    public function up(): void
    {
        Schema::table('modifications', function (Blueprint $table) {
            $table->index(['model_type', 'model_id']);
        });
    }

    public function down(): void
    {
        Schema::table('modifications', function (Blueprint $table) {
            $table->dropIndex(['model_type', 'model_id']);
        });
    }
};
