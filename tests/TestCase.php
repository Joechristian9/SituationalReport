<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Refuse to run against a real database. A cached config (bootstrap/cache/config.php)
     * makes Laravel ignore phpunit.xml, and RefreshDatabase would then wipe MySQL.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $connection = $app['config']->get('database.default');
        $database = $app['config']->get("database.connections.{$connection}.database");

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new RuntimeException(
                "Tests must use the in-memory SQLite database, got [{$connection}:{$database}]. ".
                'Run `php artisan config:clear` and try again.'
            );
        }

        return $app;
    }
}
