<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\WaterLevel; // Make sure to import your WaterLevel model

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WaterLevel>
 */
class WaterLevelFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = WaterLevel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Define some realistic gauging stations and affected areas
        $gaugingStations = [
            'Abuan River Station',
            'Cagayan River - Tuguegarao Bridge',
            'Pinacanauan River Post',
            'Ganano River Station',
            'Magat River - Downstream',
            'Siffu River Monitor',
        ];

        $affectedAreas = [
            'Barangay San Juan, Ilagan',
            'Centro Poblacion, Tumauini',
            'Barangay Cabiseria 2, Naguilian',
            'District 1, Gamu',
            'Barangay Alibagu, Ilagan',
            'Fuyo, Ilagan',
            'Cabagan Centro',
        ];

        // Generate level values logically (critical > alarm > current)
        $alarmLevel = $this->faker->randomFloat(2, 5, 8); // e.g., 6.75m
        $criticalLevel = $alarmLevel + $this->faker->randomFloat(2, 1, 3); // e.g., 8.25m
        $currentLevel = $this->faker->randomFloat(2, 1, $criticalLevel - 0.5); // e.g., 4.50m

        return [
            'gauging_station' => $this->faker->randomElement($gaugingStations),
            'current_level' => $currentLevel,
            'alarm_level' => $alarmLevel,
            'critical_level' => $criticalLevel,
            'affected_areas' => $this->faker->randomElement($affectedAreas),
            'user_id' => User::inRandomOrder()->first()->id,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
