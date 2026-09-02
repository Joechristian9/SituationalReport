<?php
// Temporary setup script - DELETE AFTER USE!
// This will run migrations and seeders on the server

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<h1>Running Migrations...</h1>";
echo "<pre>";

try {
    // Run migrate:fresh --seed with force flag (for production)
    $kernel->call('migrate:fresh', [
        '--seed' => true,
        '--force' => true
    ]);
    
    echo "\n\n✅ Migration and seeding completed successfully!\n";
    echo "\nYou can now:\n";
    echo "- Login as Admin: admin@gmail.com / admin123\n";
    echo "- Login as CDRRMO: cdrrmo@gmail.com / wardead123\n";
    echo "- Login as Barangay users with their respective credentials\n";
    echo "\n⚠️ IMPORTANT: Delete this setup.php file immediately for security!\n";
    
} catch (Exception $e) {
    echo "\n\n❌ Error: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "</pre>";
