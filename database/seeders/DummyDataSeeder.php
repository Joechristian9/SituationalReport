<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('email', 'admin@gmail.com')->first();
        
        // Philippine typhoon names list
        $typhoonNames = [
            'Aghon', 'Bising', 'Carina', 'Dindo', 'Enteng', 'Ferdie', 'Gener', 'Helen',
            'Igme', 'Julian', 'Kristine', 'Leon', 'Marce', 'Nika', 'Ofel', 'Pepito',
            'Quinta', 'Rolly', 'Siony', 'Tonyo', 'Ulysses', 'Vicky', 'Warren', 'Yoyong',
            'Zosimo', 'Alamid', 'Bruno', 'Conching', 'Dolor', 'Ernie', 'Florante', 'Gardo',
            'Huaning', 'Ismael', 'Julio', 'Karding', 'Luis', 'Maymay', 'Neneng', 'Obet',
            'Paeng', 'Quedan', 'Ramon', 'Sarah', 'Tino', 'Ursula', 'Viring', 'Waldo',
            'Yayang', 'Zigzag'
        ];

        $descriptions = [
            'Severe tropical storm affecting Northern Luzon',
            'Tropical depression with moderate rainfall',
            'Strong typhoon with heavy winds and rainfall',
            'Super typhoon with destructive winds',
            'Tropical storm bringing continuous rain',
            'Weak tropical depression',
            'Intense typhoon with storm surge',
            'Moderate tropical storm',
            'Category 5 super typhoon',
            'Fast-moving tropical cyclone'
        ];

        $typhoonIds = [];
        
        // Create 50 typhoons with varied statuses and dates
        for ($i = 0; $i < 50; $i++) {
            // Most recent typhoon (active) starts 3 days ago, others go back in time
            $daysAgo = $i === 0 ? 3 : (30 + ($i * 7));
            $startDate = Carbon::now()->subDays($daysAgo);
            
            // Determine status: most recent is active, rest are ended
            if ($i === 0) {
                $status = 'active';
                $endDate = null;
                $endedBy = null;
            } else {
                $status = 'ended';
                $endDate = $startDate->copy()->addDays(rand(3, 10));
                $endedBy = $adminUser->id;
            }
            
            $typhoonIds[] = DB::table('typhoons')->insertGetId([
                'name' => $typhoonNames[$i],
                'description' => $descriptions[$i % count($descriptions)],
                'status' => $status,
                'started_at' => $startDate,
                'ended_at' => $endDate,
                'created_by' => $adminUser->id,
                'ended_by' => $endedBy,
                'created_at' => $startDate,
                'updated_at' => $endDate ?? $startDate,
            ]);
        }

        $cdrrmoUser = User::where('email', 'cdrrmo@gmail.com')->first();
        $iwdUser = User::where('email', 'iwd@gmail.com')->first();
        $iselco2User = User::where('email', 'iselco2@gmail.com')->first();
        $ceoUser = User::where('email', 'ceo@gmail.com')->first();
        $pnpUser = User::where('email', 'pnp@gmail.com')->first();
        $cswdoUser = User::where('email', 'cswdo@gmail.com')->first();
        $caoUser = User::where('email', 'cao@gmail.com')->first();

        $this->command->info('Created 50 typhoons...');

        // Weather Reports - All for Ilagan with different conditions
        $weatherConditions = [
            [
                'sky_condition' => 'Partly Cloudy',
                'wind' => 'Light breeze, 10-15 km/h from Northeast',
                'precipitation' => 'No rainfall',
                'sea_condition' => 'Calm',
            ],
            [
                'sky_condition' => 'Overcast',
                'wind' => 'Moderate winds, 25-30 km/h from East',
                'precipitation' => 'Light rain, 5-10mm',
                'sea_condition' => 'Slight',
            ],
            [
                'sky_condition' => 'Heavy Clouds',
                'wind' => 'Strong winds, 45-55 km/h from Southeast',
                'precipitation' => 'Heavy rain, 50-75mm',
                'sea_condition' => 'Moderate',
            ],
            [
                'sky_condition' => 'Thunderstorms',
                'wind' => 'Very strong winds, 65-80 km/h from South',
                'precipitation' => 'Intense rainfall, 100-150mm',
                'sea_condition' => 'Rough',
            ],
            [
                'sky_condition' => 'Clear Skies',
                'wind' => 'Calm, 5-8 km/h from North',
                'precipitation' => 'No rainfall',
                'sea_condition' => 'Calm',
            ],
        ];

        // Add weather reports for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            // For active typhoon (index 0), create reports from last 3 days with recent timestamps
            if ($index === 0) {
                // Create 5 weather reports spread over the last 3 days, with the latest being very recent
                foreach ($weatherConditions as $condIndex => $condition) {
                    $hoursAgo = ($condIndex * 12); // Space them 12 hours apart
                    DB::table('weather_reports')->insert([
                        'typhoon_id' => $typhoonId,
                        'user_id' => $cdrrmoUser->id,
                        'municipality' => 'Ilagan',
                        'sky_condition' => $condition['sky_condition'],
                        'wind' => $condition['wind'],
                        'precipitation' => $condition['precipitation'],
                        'sea_condition' => $condition['sea_condition'],
                        'created_at' => Carbon::now()->subHours($hoursAgo),
                        'updated_at' => Carbon::now()->subHours($hoursAgo),
                    ]);
                }
            } else {
                $daysAgo = $index === 1 ? 30 : (30 + ($index * 7));
                foreach ($weatherConditions as $condIndex => $condition) {
                    DB::table('weather_reports')->insert([
                        'typhoon_id' => $typhoonId,
                        'user_id' => $cdrrmoUser->id,
                        'municipality' => 'Ilagan',
                        'sky_condition' => $condition['sky_condition'],
                        'wind' => $condition['wind'],
                        'precipitation' => $condition['precipitation'],
                        'sea_condition' => $condition['sea_condition'],
                        'created_at' => Carbon::now()->subDays($daysAgo - $condIndex),
                        'updated_at' => Carbon::now()->subDays($daysAgo - $condIndex),
                    ]);
                }
            }
        }
        
        $this->command->info('Created weather reports for all typhoons...');

        // Water Levels
        $waterLevelData = [
            ['gauging_station' => 'Cagayan River - Ilagan', 'current_level' => 8.5, 'alarm_level' => 10.0, 'critical_level' => 12.0, 'affected_areas' => 'Barangay Alibagu, Barangay Marana'],
            ['gauging_station' => 'Pinacanauan River', 'current_level' => 6.2, 'alarm_level' => 8.0, 'critical_level' => 10.0, 'affected_areas' => 'Barangay San Felipe, Barangay Naguilian'],
            ['gauging_station' => 'Ilagan River', 'current_level' => 4.8, 'alarm_level' => 7.0, 'critical_level' => 9.0, 'affected_areas' => 'Barangay Centro, Barangay Bagong Bayan'],
        ];

        // Add water levels for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($waterLevelData as $data) {
                DB::table('water_levels')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $cdrrmoUser->id,
                    'gauging_station' => $data['gauging_station'],
                    'current_level' => $data['current_level'] + (rand(-20, 20) / 10),
                    'alarm_level' => $data['alarm_level'],
                    'critical_level' => $data['critical_level'],
                    'affected_areas' => $data['affected_areas'],
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // Electricity Services
        $electricityData = [
            ['status' => 'Power restored in all areas', 'barangays_affected' => 'None', 'remarks' => 'All systems operational'],
            ['status' => 'Partial power outage due to damaged lines', 'barangays_affected' => 'Barangay Alibagu, Barangay Marana, Barangay San Felipe', 'remarks' => 'Repair crews deployed, estimated restoration in 24 hours'],
            ['status' => 'Complete power interruption', 'barangays_affected' => 'Barangay Centro, Barangay Bagong Bayan, Barangay Naguilian, Barangay San Juan', 'remarks' => 'Major transformer damage, requires replacement parts'],
        ];

        // Add electricity services for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            $dataIndex = $index % count($electricityData);
            DB::table('electricity_services')->insert([
                'typhoon_id' => $typhoonId,
                'user_id' => $iselco2User->id,
                'status' => $electricityData[$dataIndex]['status'],
                'barangays_affected' => $electricityData[$dataIndex]['barangays_affected'],
                'remarks' => $electricityData[$dataIndex]['remarks'],
                'created_at' => Carbon::now()->subDays($daysAgo),
                'updated_at' => Carbon::now()->subDays($daysAgo),
            ]);
        }

        // Water Services
        $waterServiceData = [
            ['source' => 'Ilagan Water District - Main Reservoir', 'barangays' => 'Barangay Centro, Barangay Bagong Bayan, Barangay San Juan', 'status' => 'Normal operations', 'remarks' => 'Water supply adequate'],
            ['source' => 'Deep Well - Alibagu', 'barangays' => 'Barangay Alibagu, Barangay Marana', 'status' => 'Reduced pressure due to power outage', 'remarks' => 'Using generator backup'],
            ['source' => 'Spring Source - Naguilian', 'barangays' => 'Barangay Naguilian, Barangay San Felipe', 'status' => 'Temporarily suspended', 'remarks' => 'Source contaminated by flooding, water treatment ongoing'],
        ];

        // Add water services for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($waterServiceData as $data) {
                DB::table('water_services')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $iwdUser->id,
                    'source_of_water' => $data['source'],
                    'barangays_served' => $data['barangays'],
                    'status' => $data['status'],
                    'remarks' => $data['remarks'],
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // Roads
        $roadData = [
            ['classification' => 'National Road', 'name' => 'Maharlika Highway', 'status' => 'Open', 'areas' => 'All sections', 're_routing' => 'None', 'remarks' => 'Road clear and passable'],
            ['classification' => 'Provincial Road', 'name' => 'Ilagan-Tumauini Road', 'status' => 'Passable with caution', 'areas' => 'Barangay Alibagu section', 're_routing' => 'None', 'remarks' => 'Minor flooding, slow traffic'],
            ['classification' => 'Municipal Road', 'name' => 'Centro-Naguilian Road', 'status' => 'Closed', 'areas' => 'Barangay San Felipe', 're_routing' => 'Via Barangay Marana', 'remarks' => 'Road washed out, repair ongoing'],
            ['classification' => 'Barangay Road', 'name' => 'Alibagu Interior Road', 'status' => 'Not Passable', 'areas' => 'Sitio Malaya', 're_routing' => 'Via main barangay road', 'remarks' => 'Landslide blocking road'],
        ];

        // Add roads for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($roadData as $data) {
                DB::table('roads')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $ceoUser->id,
                    'road_classification' => $data['classification'],
                    'name_of_road' => $data['name'],
                    'status' => $data['status'],
                    'areas_affected' => $data['areas'],
                    're_routing' => $data['re_routing'],
                    'remarks' => $data['remarks'],
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // Bridges
        $bridgeData = [
            ['classification' => 'National', 'name' => 'Cagayan River Bridge', 'status' => 'Passable', 'areas' => 'None', 're_routing' => 'None', 'remarks' => 'Bridge structurally sound'],
            ['classification' => 'Provincial', 'name' => 'Pinacanauan Bridge', 'status' => 'Passable', 'areas' => 'None', 're_routing' => 'None', 'remarks' => 'Water level below bridge deck'],
            ['classification' => 'Municipal', 'name' => 'San Felipe Bridge', 'status' => 'Not Passable', 'areas' => 'Barangay San Felipe, Barangay Naguilian', 're_routing' => 'Via Maharlika Highway', 'remarks' => 'Bridge submerged, water over deck'],
        ];

        // Add bridges for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($bridgeData as $data) {
                DB::table('bridges')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $ceoUser->id,
                    'road_classification' => $data['classification'],
                    'name_of_bridge' => $data['name'],
                    'status' => $data['status'],
                    'areas_affected' => $data['areas'],
                    're_routing' => $data['re_routing'],
                    'remarks' => $data['remarks'],
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // Pre-emptive Evacuations
        $preEmptiveData = [
            ['barangay' => 'Alibagu', 'center' => 'Alibagu Elementary School', 'families' => 45, 'persons' => 180, 'outside_center' => 'Relatives homes', 'outside_families' => 12, 'outside_persons' => 48],
            ['barangay' => 'Marana', 'center' => 'Marana Barangay Hall', 'families' => 32, 'persons' => 128, 'outside_center' => 'Community center', 'outside_families' => 8, 'outside_persons' => 32],
            ['barangay' => 'San Felipe', 'center' => 'San Felipe Covered Court', 'families' => 67, 'persons' => 268, 'outside_center' => 'Church compound', 'outside_families' => 15, 'outside_persons' => 60],
            ['barangay' => 'Naguilian', 'center' => 'Naguilian High School', 'families' => 54, 'persons' => 216, 'outside_center' => 'Relatives and friends', 'outside_families' => 20, 'outside_persons' => 80],
        ];

        // Add pre-emptive evacuations for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($preEmptiveData as $data) {
                $familyVariation = rand(-10, 15);
                $families = max(0, $data['families'] + $familyVariation);
                $persons = $families * 4;
                $outsideFamilies = max(0, $data['outside_families'] + rand(-5, 10));
                $outsidePersons = $outsideFamilies * 4;
                
                DB::table('pre_emptive_reports')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $cswdoUser->id,
                    'barangay' => $data['barangay'],
                    'evacuation_center' => $data['center'],
                    'families' => $families,
                    'persons' => $persons,
                    'outside_center' => $data['outside_center'],
                    'outside_families' => $outsideFamilies,
                    'outside_persons' => $outsidePersons,
                    'total_families' => $families + $outsideFamilies,
                    'total_persons' => $persons + $outsidePersons,
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // Incidents Monitored
        $incidentData = [
            ['kind' => 'Flooding', 'datetime' => Carbon::now()->subHours(15), 'location' => 'Barangay Alibagu, Sitio Malaya', 'description' => 'Flash flood due to heavy rainfall, water level reached 1.5 meters', 'remarks' => 'Residents evacuated, no casualties'],
            ['kind' => 'Landslide', 'datetime' => Carbon::now()->subHours(12), 'location' => 'Barangay San Felipe, Mountain area', 'description' => 'Small landslide blocking barangay road', 'remarks' => 'Road clearing operations ongoing'],
            ['kind' => 'Fallen Trees', 'datetime' => Carbon::now()->subHours(10), 'location' => 'Maharlika Highway, Km 425', 'description' => 'Large tree fell across highway due to strong winds', 'remarks' => 'Tree removed, road now clear'],
            ['kind' => 'Power Line Down', 'datetime' => Carbon::now()->subHours(8), 'location' => 'Barangay Marana', 'description' => 'Electric post damaged by strong winds', 'remarks' => 'ISELCO II notified, repair crew dispatched'],
        ];

        // Add incidents for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($incidentData as $incIndex => $data) {
                $incidentDate = Carbon::now()->subDays($daysAgo)->subHours($incIndex * 3);
                DB::table('incident_monitored')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $pnpUser->id,
                    'kinds_of_incident' => $data['kind'],
                    'date_time' => $incidentDate,
                    'location' => $data['location'],
                    'description' => $data['description'],
                    'remarks' => $data['remarks'],
                    'created_at' => $incidentDate,
                    'updated_at' => $incidentDate,
                ]);
            }
        }

        // Damaged Houses
        $damagedHousesData = [
            ['barangay' => 'Alibagu', 'partially' => 15, 'totally' => 3],
            ['barangay' => 'Marana', 'partially' => 8, 'totally' => 1],
            ['barangay' => 'San Felipe', 'partially' => 22, 'totally' => 5],
            ['barangay' => 'Naguilian', 'partially' => 18, 'totally' => 4],
            ['barangay' => 'Centro', 'partially' => 5, 'totally' => 0],
            ['barangay' => 'Bagong Bayan', 'partially' => 12, 'totally' => 2],
        ];

        // Add damaged houses for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($damagedHousesData as $data) {
                $partially = max(0, $data['partially'] + rand(-5, 10));
                $totally = max(0, $data['totally'] + rand(-2, 5));
                DB::table('damaged_house_reports')->insert([
                    'typhoon_id' => $typhoonId,
                    'user_id' => $cswdoUser->id,
                    'barangay' => $data['barangay'],
                    'partially' => $partially,
                    'totally' => $totally,
                    'total' => $partially + $totally,
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        // Agriculture Reports
        $agricultureData = [
            ['crops' => 'RICE', 'standing_crop' => 450.50, 'stage' => 'Vegetative', 'area_affected' => 125.75, 'production_loss' => 2500000.00, 'remarks' => 'Flooded rice fields in lowland areas'],
            ['crops' => 'CORN', 'standing_crop' => 320.25, 'stage' => 'Reproductive', 'area_affected' => 85.50, 'production_loss' => 1800000.00, 'remarks' => 'Strong winds damaged corn stalks'],
            ['crops' => 'HVCC (Vegetables)', 'standing_crop' => 180.00, 'stage' => 'Mature', 'area_affected' => 65.25, 'production_loss' => 950000.00, 'remarks' => 'Heavy rainfall destroyed vegetable crops'],
            ['crops' => 'BANANA', 'standing_crop' => 95.75, 'stage' => 'Fruiting', 'area_affected' => 35.50, 'production_loss' => 650000.00, 'remarks' => 'Banana plants uprooted by strong winds'],
        ];

        // Add agriculture reports for all typhoons
        foreach ($typhoonIds as $index => $typhoonId) {
            $daysAgo = 30 + ($index * 7);
            foreach ($agricultureData as $data) {
                DB::table('agriculture_reports')->insert([
                    'typhoon_id' => $typhoonId,
                    'crops_affected' => $data['crops'],
                    'standing_crop_ha' => $data['standing_crop'] + rand(-50, 100),
                    'stage_of_crop' => $data['stage'],
                    'total_area_affected_ha' => $data['area_affected'] + rand(-20, 40),
                    'total_production_loss' => $data['production_loss'] + rand(-500000, 1000000),
                    'remarks' => $data['remarks'],
                    'created_at' => Carbon::now()->subDays($daysAgo),
                    'updated_at' => Carbon::now()->subDays($daysAgo),
                ]);
            }
        }

        $this->command->info('Dummy data seeded successfully!');
        $this->command->info('- 50 Typhoons created with comprehensive history');
        $this->command->info('- Weather reports for Ilagan with varying conditions (250 reports)');
        $this->command->info('- Water levels, electricity, water services for all typhoons');
        
        // Casualties (Dead)
        $casualtiesData = [
            ['name' => 'Juan Dela Cruz', 'age' => 45, 'sex' => 'male', 'address' => 'Barangay San Vicente, Ilagan City', 'cause_of_death' => 'Drowning due to flash flood', 'place_of_incident' => 'Cagayan River'],
            ['name' => 'Maria Santos', 'age' => 32, 'sex' => 'female', 'address' => 'Barangay Alibagu, Ilagan City', 'cause_of_death' => 'Landslide', 'place_of_incident' => 'Mountain area, Barangay Alibagu'],
            ['name' => 'Pedro Reyes', 'age' => 58, 'sex' => 'male', 'address' => 'Barangay Marana, Ilagan City', 'cause_of_death' => 'Fallen tree', 'place_of_incident' => 'Maharlika Highway'],
        ];

        // Get the FIRST typhoon (which is the active one - Aghon)
        $activeTyphoonId = DB::table('typhoons')->where('status', 'active')->value('id');
        
        // Add casualties for active typhoon only
        foreach ($casualtiesData as $data) {
            DB::table('casualties')->insert([
                'typhoon_id' => $activeTyphoonId,
                'user_id' => $cdrrmoUser->id,
                'name' => $data['name'],
                'age' => $data['age'],
                'sex' => $data['sex'],
                'address' => $data['address'],
                'cause_of_death' => $data['cause_of_death'],
                'date_died' => Carbon::now()->subDays(rand(1, 3)),
                'place_of_incident' => $data['place_of_incident'],
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ]);
        }

        // Injured Persons
        $injuredData = [
            ['name' => 'Ana Garcia', 'age' => 28, 'sex' => 'female', 'address' => 'Barangay San Felipe, Ilagan City', 'diagnosis' => 'Fractured left leg, minor lacerations', 'place_of_incident' => 'Collapsed house roof', 'remarks' => 'Stable condition, admitted to Ilagan City Hospital'],
            ['name' => 'Roberto Cruz', 'age' => 41, 'sex' => 'male', 'address' => 'Barangay Bagong Bayan, Ilagan City', 'diagnosis' => 'Head trauma, multiple contusions', 'place_of_incident' => 'Hit by flying debris', 'remarks' => 'Under observation, recovering well'],
            ['name' => 'Elena Mendoza', 'age' => 35, 'sex' => 'female', 'address' => 'Barangay Centro, Ilagan City', 'diagnosis' => 'Sprained ankle, minor cuts', 'place_of_incident' => 'Slipped on flooded street', 'remarks' => 'Treated and released'],
            ['name' => 'Carlos Ramos', 'age' => 52, 'sex' => 'male', 'address' => 'Barangay Naguilian, Ilagan City', 'diagnosis' => 'Broken arm, chest injuries', 'place_of_incident' => 'Fallen tree branch', 'remarks' => 'Surgery performed, stable'],
            ['name' => 'Luz Fernandez', 'age' => 19, 'sex' => 'female', 'address' => 'Barangay San Juan, Ilagan City', 'diagnosis' => 'Hypothermia, exhaustion', 'place_of_incident' => 'Rescued from flooded area', 'remarks' => 'Recovering, expected discharge soon'],
        ];

        // Add injured persons for active typhoon only
        foreach ($injuredData as $data) {
            DB::table('injureds')->insert([
                'typhoon_id' => $activeTyphoonId,
                'user_id' => $cdrrmoUser->id,
                'name' => $data['name'],
                'age' => $data['age'],
                'sex' => $data['sex'],
                'address' => $data['address'],
                'diagnosis' => $data['diagnosis'],
                'date_admitted' => Carbon::now()->subDays(rand(1, 3)),
                'place_of_incident' => $data['place_of_incident'],
                'remarks' => $data['remarks'],
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ]);
        }

        // Missing Persons
        $missingData = [
            ['name' => 'Miguel Torres', 'age' => 34, 'sex' => 'male', 'address' => 'Barangay Calamagui, Ilagan City', 'cause' => 'Swept away by strong current while crossing flooded river', 'remarks' => 'Search and rescue operations ongoing'],
            ['name' => 'Sofia Villanueva', 'age' => 22, 'sex' => 'female', 'address' => 'Barangay Malalam, Ilagan City', 'cause' => 'Last seen evacuating from landslide area', 'remarks' => 'Family reported missing, search teams deployed'],
        ];

        // Add missing persons for active typhoon only
        foreach ($missingData as $data) {
            DB::table('missing')->insert([
                'typhoon_id' => $activeTyphoonId,
                'user_id' => $cdrrmoUser->id,
                'name' => $data['name'],
                'age' => $data['age'],
                'sex' => $data['sex'],
                'address' => $data['address'],
                'cause' => $data['cause'],
                'remarks' => $data['remarks'],
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ]);
        }

        $this->command->info('- Casualties: 3 dead, 5 injured, 2 missing (for active typhoon)');
        $this->command->info('- Roads and bridges status for all typhoons');
        $this->command->info('- Pre-emptive evacuations with varied numbers');
        $this->command->info('- Incidents monitored for all typhoons');
        $this->command->info('- Damaged houses reports for all typhoons');
        $this->command->info('- Agriculture reports for all typhoons (200 reports)');
    }
}
