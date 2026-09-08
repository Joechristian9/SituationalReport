<?php

/**
 * Production Cleanup Script
 * Run this on production server to remove disaster type management system
 * 
 * Usage: php cleanup_production.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== STARTING PRODUCTION CLEANUP ===\n\n";

$errors = [];
$success = [];

// Step 1: Drop disaster_types table
echo "Step 1: Removing disaster_types table...\n";
try {
    if (Schema::hasTable('disaster_types')) {
        Schema::dropIfExists('disaster_types');
        $success[] = "✓ Dropped disaster_types table";
        echo "  ✓ disaster_types table removed\n";
    } else {
        $success[] = "✓ disaster_types table already removed";
        echo "  ✓ disaster_types table doesn't exist (OK)\n";
    }
} catch (Exception $e) {
    $errors[] = "✗ Failed to drop disaster_types table: " . $e->getMessage();
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

// Step 2: Drop disaster_type_id column
echo "\nStep 2: Removing disaster_type_id column...\n";
try {
    if (Schema::hasColumn('disasters', 'disaster_type_id')) {
        Schema::table('disasters', function($table) {
            try {
                $table->dropForeign(['disaster_type_id']);
            } catch (Exception $e) {
                // Foreign key might not exist
            }
            $table->dropColumn('disaster_type_id');
        });
        $success[] = "✓ Removed disaster_type_id column";
        echo "  ✓ disaster_type_id column removed\n";
    } else {
        $success[] = "✓ disaster_type_id column already removed";
        echo "  ✓ disaster_type_id column doesn't exist (OK)\n";
    }
} catch (Exception $e) {
    $errors[] = "✗ Failed to drop disaster_type_id column: " . $e->getMessage();
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

// Step 3: Verify disaster_type ENUM exists
echo "\nStep 3: Verifying disaster_type ENUM column...\n";
if (Schema::hasColumn('disasters', 'disaster_type')) {
    $success[] = "✓ disaster_type ENUM column exists";
    echo "  ✓ disaster_type ENUM column exists (OK)\n";
} else {
    $errors[] = "✗ disaster_type ENUM column is missing!";
    echo "  ✗ WARNING: disaster_type ENUM column is missing!\n";
    echo "     You may need to restore it manually.\n";
}

// Step 4: Clean migration records
echo "\nStep 4: Cleaning migration records...\n";
try {
    $deleted = DB::table('migrations')
        ->where('migration', 'like', '%2026_09_08%')
        ->where('migration', 'like', '%disaster_type%')
        ->delete();
    
    if ($deleted > 0) {
        $success[] = "✓ Removed $deleted migration records";
        echo "  ✓ Removed $deleted migration records\n";
    } else {
        $success[] = "✓ No migration records to remove";
        echo "  ✓ No migration records found (OK)\n";
    }
} catch (Exception $e) {
    $errors[] = "✗ Failed to clean migration records: " . $e->getMessage();
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

// Summary
echo "\n=== CLEANUP SUMMARY ===\n\n";

if (count($success) > 0) {
    echo "Successes:\n";
    foreach ($success as $msg) {
        echo "  $msg\n";
    }
}

if (count($errors) > 0) {
    echo "\nErrors:\n";
    foreach ($errors as $msg) {
        echo "  $msg\n";
    }
    echo "\nCleanup completed with errors. Please review above.\n";
    exit(1);
} else {
    echo "\n✓ Cleanup completed successfully!\n";
    echo "\nNext steps:\n";
    echo "1. Run: php artisan optimize:clear\n";
    echo "2. Run: php artisan config:cache\n";
    echo "3. Run: php artisan route:cache\n";
    echo "4. Restart PHP-FPM or web server\n";
    exit(0);
}
