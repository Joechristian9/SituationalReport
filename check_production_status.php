<?php

// Run this on production to check the state

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PRODUCTION STATUS CHECK ===\n\n";

// Check database columns
echo "Database Structure:\n";
echo "- disasters.disaster_type (ENUM): " . (Schema::hasColumn('disasters', 'disaster_type') ? 'EXISTS ✓' : 'MISSING ✗') . "\n";
echo "- disasters.disaster_type_id (FK): " . (Schema::hasColumn('disasters', 'disaster_type_id') ? 'EXISTS ✗ (SHOULD BE REMOVED)' : 'MISSING ✓') . "\n";
echo "- disaster_types table: " . (Schema::hasTable('disaster_types') ? 'EXISTS ✗ (SHOULD BE REMOVED)' : 'MISSING ✓') . "\n\n";

// Check if files exist
echo "Code Files:\n";
echo "- DisasterType model: " . (file_exists(__DIR__.'/app/Models/DisasterType.php') ? 'EXISTS ✗ (SHOULD BE REMOVED)' : 'MISSING ✓') . "\n";
echo "- DisasterTypeController: " . (file_exists(__DIR__.'/app/Http/Controllers/DisasterTypeController.php') ? 'EXISTS ✗ (SHOULD BE REMOVED)' : 'MISSING ✓') . "\n\n";

// Check git status
echo "Git Status:\n";
exec('git log --oneline -1', $output);
echo "- Current commit: " . implode("\n", $output) . "\n\n";

// Check migration status
echo "Migration Status:\n";
$migrations = DB::table('migrations')
    ->where('migration', 'like', '%disaster_type%')
    ->orderBy('migration')
    ->get();

foreach ($migrations as $migration) {
    echo "- {$migration->migration} (batch: {$migration->batch})\n";
}

echo "\n=== END STATUS CHECK ===\n";
