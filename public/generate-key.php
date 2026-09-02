<?php
// Generate APP_KEY - DELETE AFTER USE!

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<h1>Generating Application Key...</h1>";
echo "<pre>";

try {
    $kernel->call('key:generate', ['--force' => true, '--show' => true]);
    echo "\n\n✅ Key generated successfully!\n";
    echo "\nThe .env file has been updated.\n";
    echo "\n⚠️ IMPORTANT: Delete this generate-key.php file immediately for security!\n";
    echo "\nNow try accessing: https://pinonmain.com/public/\n";
} catch (Exception $e) {
    echo "\n\n❌ Error: " . $e->getMessage() . "\n";
}

echo "</pre>";
