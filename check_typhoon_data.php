<?php
/**
 * Quick Database Check Script
 * Run this in your browser: http://localhost/LARAVEL_PROJECT/SituationalReport/check_typhoon_data.php
 * 
 * This checks if your existing data has typhoon_id values
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\Casualty;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\Typhoon;

echo "<h1>Database Typhoon ID Check</h1>";
echo "<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>";

// Check active typhoon
$activeTyphoon = Typhoon::where('status', 'active')->first();
echo "<h2>Active Typhoon:</h2>";
if ($activeTyphoon) {
    echo "<p><strong>Name:</strong> {$activeTyphoon->name} (ID: {$activeTyphoon->id})</p>";
    echo "<p><strong>Started:</strong> {$activeTyphoon->started_at}</p>";
} else {
    echo "<p style='color: red;'><strong>NO ACTIVE TYPHOON FOUND!</strong> Create one first.</p>";
}

// Check all typhoons
echo "<h2>All Typhoons:</h2>";
$allTyphoons = Typhoon::all();
echo "<table><tr><th>ID</th><th>Name</th><th>Status</th><th>Started</th><th>Ended</th></tr>";
foreach ($allTyphoons as $t) {
    echo "<tr><td>{$t->id}</td><td>{$t->name}</td><td>{$t->status}</td><td>{$t->started_at}</td><td>{$t->ended_at}</td></tr>";
}
echo "</table>";

// Check data tables
$tables = [
    'Weather Reports' => WeatherReport::class,
    'Water Levels' => WaterLevel::class,
    'Casualties' => Casualty::class,
    'Injured' => Injured::class,
    'Missing' => Missing::class,
];

echo "<h2>Data Check (typhoon_id field):</h2>";
echo "<table>";
echo "<tr><th>Table</th><th>Total Records</th><th>With typhoon_id</th><th>Without typhoon_id</th></tr>";

foreach ($tables as $name => $model) {
    $total = $model::count();
    $withTyphoonId = $model::whereNotNull('typhoon_id')->count();
    $withoutTyphoonId = $model::whereNull('typhoon_id')->count();
    
    $color = $withoutTyphoonId > 0 ? 'color: red;' : 'color: green;';
    echo "<tr>";
    echo "<td><strong>{$name}</strong></td>";
    echo "<td>{$total}</td>";
    echo "<td style='color: green;'>{$withTyphoonId}</td>";
    echo "<td style='{$color}'>{$withoutTyphoonId}</td>";
    echo "</tr>";
}
echo "</table>";

// Solution
echo "<h2>💡 Solutions:</h2>";
echo "<ol>";
echo "<li><strong>START FRESH (Recommended):</strong> Delete old data without typhoon_id and enter new data after creating a typhoon</li>";
echo "<li><strong>UPDATE OLD DATA:</strong> Run the migration script below to link old data to a typhoon</li>";
echo "</ol>";

if ($activeTyphoon && $activeTyphoon->id) {
    echo "<h3>Quick Fix SQL (copy & run in phpMyAdmin):</h3>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border: 1px solid #ddd;'>";
    echo "-- Link all old data to active typhoon (ID: {$activeTyphoon->id})\n";
    echo "UPDATE weather_reports SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE water_levels SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE electricity_services SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE water_services SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE communications SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE roads SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE bridges SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE casualties SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE injured SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE missing SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE incident_monitored SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE affected_tourists SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE damaged_house_reports SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE suspension_of_classes SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE suspension_of_work SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE pre_emptive_reports SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE usc_declarations SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE pre_positionings SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE response_operations SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE assistance_extendeds SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "UPDATE assistance_provided_lgus SET typhoon_id = {$activeTyphoon->id} WHERE typhoon_id IS NULL;\n";
    echo "</pre>";
}

echo "<p><strong>After running the SQL, refresh this page to verify!</strong></p>";
