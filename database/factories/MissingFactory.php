<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Missing>
 */
class MissingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Define plausible causes for someone going missing during a disaster
        $causes = [
            'Swept by floodwaters',
            'Lost during evacuation',
            'Caught in landslide',
            'Building collapse',
            'Communication lines down',
            'Separated from family',
            'Unknown',
        ];

        return [
            'name' => fake()->name(),
            'age' => fake()->numberBetween(5, 80),
            'sex' => fake()->randomElement(['Male', 'Female']),
            'address' => fake()->streetAddress() . ', ' . fake()->city(),
            'cause' => fake()->randomElement($causes),
            'remarks' => fake()->sentence(10),
            'user_id' => User::inRandomOrder()->first()->id,
        ];
    }
}
