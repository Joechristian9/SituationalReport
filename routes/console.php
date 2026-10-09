<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Runs only when the server's cron calls `php artisan schedule:run` every minute (see DEPLOY.md).
Schedule::command('backup:create')->dailyAt('01:00')->withoutOverlapping();
