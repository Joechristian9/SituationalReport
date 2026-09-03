<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::where('email', 'cdrrmo@gmail.com')->first();

if ($user) {
    echo "User: {$user->name}\n";
    echo "Email: {$user->email}\n\n";
    echo "Permissions:\n";
    
    $permissions = $user->getAllPermissions();
    
    foreach ($permissions as $perm) {
        echo "- {$perm->name}\n";
    }
    
    echo "\n\nCDRRMO Detection Check:\n";
    echo "has access-weather-form: " . ($user->hasPermissionTo('access-weather-form') ? 'YES' : 'NO') . "\n";
    echo "has access-communication-form: " . ($user->hasPermissionTo('access-communication-form') ? 'YES' : 'NO') . "\n";
    echo "has access-pre-emptive-form: " . ($user->hasPermissionTo('access-pre-emptive-form') ? 'YES' : 'NO') . "\n";
    echo "has access-incident-form: " . ($user->hasPermissionTo('access-incident-form') ? 'YES' : 'NO') . "\n";
    echo "has access-agriculture-form: " . ($user->hasPermissionTo('access-agriculture-form') ? 'YES' : 'NO') . "\n";
    echo "has access-electricity-form: " . ($user->hasPermissionTo('access-electricity-form') ? 'YES' : 'NO') . "\n";
    echo "has access-water-service-form: " . ($user->hasPermissionTo('access-water-service-form') ? 'YES' : 'NO') . "\n";
    echo "has access-water-level-form: " . ($user->hasPermissionTo('access-water-level-form') ? 'YES' : 'NO') . "\n";
    echo "has access-road-form: " . ($user->hasPermissionTo('access-road-form') ? 'YES' : 'NO') . "\n";
    echo "has access-bridge-form: " . ($user->hasPermissionTo('access-bridge-form') ? 'YES' : 'NO') . "\n";
    echo "has access-pre-positioning-form: " . ($user->hasPermissionTo('access-pre-positioning-form') ? 'YES' : 'NO') . "\n";
    
} else {
    echo "User not found\n";
}
