<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class WeatherReportFactory extends Factory
{
    public function definition(): array
    {
        $municipalities = [
            'Baler',
            'Maria Aurora',
            'Dipaculao',
            'Casiguran',
            'Dinalungan',
            'Dingalan',
            'San Luis',
            'Bongabon',
            'Cabanatuan',
            'Gabaldon',
        ];

        // Generate random timestamp within the last 24 hours
        $createdAt = Carbon::now()->subHours(rand(0, 24))->subMinutes(rand(0, 59));

        return [
            'municipality' => $this->faker->randomElement($municipalities),
            'sky_condition' => $this->faker->randomElement(['Sunny', 'Cloudy', 'Rainy', 'Stormy']),
            'wind' => $this->faker->numberBetween(5, 60), // km/h
            'precipitation' => $this->faker->randomFloat(1, 0, 30), // mm
            'sea_condition' => $this->faker->randomElement(['Calm', 'Moderate', 'Rough']),
            'user_id' => 1,
            'updated_by' => 1,
            'created_at' => $createdAt,
            'updated_at' => $createdAt->copy()->addMinutes(rand(5, 60)), // slightly later
        ];
    }
}
