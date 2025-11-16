<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;

class LinkDataToTyphoon extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'typhoon:link-data {typhoon_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Link all data without typhoon_id to a specific typhoon';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $typhoonId = $this->argument('typhoon_id');
        
        // If no typhoon_id provided, use active typhoon or ask user
        if (!$typhoonId) {
            $activeTyphoon = Typhoon::where('status', 'active')->first();
            
            if ($activeTyphoon) {
                $this->info("Found active typhoon: {$activeTyphoon->name} (ID: {$activeTyphoon->id})");
                if ($this->confirm('Link all orphaned data to this typhoon?', true)) {
                    $typhoonId = $activeTyphoon->id;
                } else {
                    $this->error('Cancelled.');
                    return 1;
                }
            } else {
                $typhoons = Typhoon::all();
                if ($typhoons->isEmpty()) {
                    $this->error('No typhoons found! Create a typhoon first.');
                    return 1;
                }
                
                $this->table(['ID', 'Name', 'Status', 'Started'], $typhoons->map(function($t) {
                    return [$t->id, $t->name, $t->status, $t->started_at];
                })->toArray());
                
                $typhoonId = $this->ask('Enter typhoon ID to link data to:');
            }
        }
        
        // Verify typhoon exists
        $typhoon = Typhoon::find($typhoonId);
        if (!$typhoon) {
            $this->error("Typhoon with ID {$typhoonId} not found!");
            return 1;
        }
        
        $this->info("Linking orphaned data to: {$typhoon->name} (ID: {$typhoon->id})");
        
        // Tables to update
        $tables = [
            'weather_reports',
            'water_levels',
            'electricity_services',
            'water_services',
            'communications',
            'roads',
            'bridges',
            'casualties',
            'injured',
            'missing',
            'incident_monitored',
            'affected_tourists',
            'damaged_house_reports',
            'suspension_of_classes',
            'suspension_of_work',
            'pre_emptive_reports',
            'usc_declarations',
            'pre_positionings',
            'response_operations',
            'assistance_extendeds',
            'assistance_provided_lgus',
        ];
        
        $totalUpdated = 0;
        
        $this->info('Updating tables...');
        $progressBar = $this->output->createProgressBar(count($tables));
        $progressBar->start();
        
        foreach ($tables as $table) {
            try {
                $updated = DB::table($table)
                    ->whereNull('typhoon_id')
                    ->update(['typhoon_id' => $typhoon->id]);
                
                if ($updated > 0) {
                    $this->newLine();
                    $this->info("✓ {$table}: {$updated} records updated");
                }
                $totalUpdated += $updated;
            } catch (\Exception $e) {
                $this->newLine();
                $this->warn("⚠ {$table}: {$e->getMessage()}");
            }
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine(2);
        
        if ($totalUpdated > 0) {
            $this->info("✅ SUCCESS! {$totalUpdated} total records linked to typhoon: {$typhoon->name}");
            $this->info("You can now end the typhoon and generate the PDF.");
        } else {
            $this->warn("No orphaned data found. All data already has typhoon_id.");
        }
        
        return 0;
    }
}
