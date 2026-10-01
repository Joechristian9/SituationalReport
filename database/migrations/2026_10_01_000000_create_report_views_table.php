<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tracks when each user last viewed a report type (e.g. casualties),
     * so new reports since then can be shown as notification badges.
     */
    public function up(): void
    {
        Schema::create('report_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('report_type');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'report_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_views');
    }
};
