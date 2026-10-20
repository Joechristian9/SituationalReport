<?php

use App\Http\Middleware\CheckDisasterStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HandleOfflineSubmission;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Sentry\Laravel\Integration;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class,
        ]);
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'typhoon.active' => CheckDisasterStatus::class,
            'offline.sync' => HandleOfflineSubmission::class,
        ]);
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Errors go to Sentry (an email per new error) once SENTRY_LARAVEL_DSN is set; without it this does nothing.
        Integration::handles($exceptions);
    })->create();
