<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Bridge;

class CleanupEmptyBridges extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bridges:cleanup-empty';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete bridge records where all data fields are empty';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for empty bridge records...');

        // Find bridges where all data fields are empty
        $emptyBridges = Bridge::where(function($query) {
            $query->where(function($q) {
                $q->whereNull('road_classification')
                  ->orWhere('road_classification', '');
            })
            ->where(function($q) {
                $q->whereNull('name_of_bridge')
                  ->orWhere('name_of_bridge', '');
            })
            ->where(function($q) {
                $q->whereNull('status')
                  ->orWhere('status', '');
            })
            ->where(function($q) {
                $q->whereNull('areas_affected')
                  ->orWhere('areas_affected', '');
            })
            ->where(function($q) {
                $q->whereNull('re_routing')
                  ->orWhere('re_routing', '');
            })
            ->where(function($q) {
                $q->whereNull('remarks')
                  ->orWhere('remarks', '');
            });
        })->get();

        $count = $emptyBridges->count();
        $this->info("Found {$count} empty bridge records");

        if ($count > 0) {
            if ($this->confirm('Do you want to delete these empty records?', true)) {
                $this->info('Deleting empty records...');
                
                foreach ($emptyBridges as $bridge) {
                    $this->line("  - Deleting bridge ID: {$bridge->id}");
                    $bridge->delete();
                }
                
                $this->success("Successfully deleted {$count} empty bridge records!");
            } else {
                $this->info('Cleanup cancelled.');
            }
        } else {
            $this->info('No empty records found. Database is clean!');
        }

        return 0;
    }
}
