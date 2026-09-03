<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

header('Content-Type: text/plain');

$user = App\Models\User::where('email', 'cdrrmo@gmail.com')->first();

if ($user) {
    echo "User: {$user->name}\n";
    echo "Email: {$user->email}\n\n";
    echo "===========================================\n";
    echo "ALL PERMISSIONS:\n";
    echo "===========================================\n";
    
    $permissions = $user->getAllPermissions();
    
    if ($permissions->count() > 0) {
        foreach ($permissions as $perm) {
            echo "✓ {$perm->name}\n";
        }
    } else {
        echo "No permissions found\n";
    }
    
    echo "\n\n===========================================\n";
    echo "CDRRMO DETECTION CHECK:\n";
    echo "===========================================\n";
    
    $checks = [
        'access-weather-form',
        'access-communication-form',
        'access-pre-emptive-form',
        'access-incident-form',
        'access-agriculture-form',
        'access-electricity-form',
        'access-water-service-form',
        'access-water-level-form',
        'access-road-form',
        'access-bridge-form',
        'access-pre-positioning-form'
    ];
    
    foreach ($checks as $permission) {
        $has = $user->hasPermissionTo($permission);
        $status = $has ? '✓ YES' : '✗ NO';
        echo str_pad($permission, 35) . " : $status\n";
    }
    
    echo "\n\n===========================================\n";
    echo "CURRENT isCDRRMO LOGIC RESULT:\n";
    echo "===========================================\n";
    
    $isCDRRMO = $user->hasPermissionTo('access-weather-form') && 
        $user->hasPermissionTo('access-communication-form') &&
        $user->hasPermissionTo('access-pre-emptive-form') &&
        $user->hasPermissionTo('access-incident-form') &&
        !$user->hasPermissionTo('access-electricity-form') &&
        !$user->hasPermissionTo('access-water-service-form') &&
        !$user->hasPermissionTo('access-water-level-form') &&
        !$user->hasPermissionTo('access-road-form') &&
        !$user->hasPermissionTo('access-bridge-form') &&
        !$user->hasPermissionTo('access-pre-positioning-form');
    
    echo "isCDRRMO evaluates to: " . ($isCDRRMO ? 'TRUE (should hide submenus)' : 'FALSE (will show all submenus)') . "\n";
    
    echo "\n\n===========================================\n";
    echo "SUGGESTION:\n";
    echo "===========================================\n";
    
    if (!$isCDRRMO) {
        echo "The current logic is NOT identifying this user as CDRRMO.\n";
        echo "This is why the submenus are still visible.\n\n";
        
        // Check what's failing
        if (!$user->hasPermissionTo('access-weather-form')) {
            echo "Missing: access-weather-form\n";
        }
        if (!$user->hasPermissionTo('access-communication-form')) {
            echo "Missing: access-communication-form\n";
        }
        if (!$user->hasPermissionTo('access-pre-emptive-form')) {
            echo "Missing: access-pre-emptive-form\n";
        }
        if (!$user->hasPermissionTo('access-incident-form')) {
            echo "Missing: access-incident-form\n";
        }
        if ($user->hasPermissionTo('access-electricity-form')) {
            echo "Has (but shouldn't): access-electricity-form\n";
        }
        if ($user->hasPermissionTo('access-water-service-form')) {
            echo "Has (but shouldn't): access-water-service-form\n";
        }
        if ($user->hasPermissionTo('access-water-level-form')) {
            echo "Has (but shouldn't): access-water-level-form\n";
        }
        if ($user->hasPermissionTo('access-road-form')) {
            echo "Has (but shouldn't): access-road-form\n";
        }
        if ($user->hasPermissionTo('access-bridge-form')) {
            echo "Has (but shouldn't): access-bridge-form\n";
        }
        if ($user->hasPermissionTo('access-pre-positioning-form')) {
            echo "Has (but shouldn't): access-pre-positioning-form\n";
        }
    } else {
        echo "Logic correctly identifies this as CDRRMO user.\n";
        echo "Submenus should be hidden. Check browser cache or rebuild assets.\n";
    }
    
} else {
    echo "User not found with email: cdrrmo@gmail.com\n";
}
