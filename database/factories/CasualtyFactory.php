<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Casualty; // Ensure your model is imported
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Casualty>
 */
class CasualtyFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Casualty::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // A list of realistic, disaster-related causes of death
        $causes = [
            'Drowning',
            'Electrocution',
            'Falling Debris',
            'Landslide',
            'Hypothermia',
            'Heart Attack (stress-induced)',
            'Crush Injury'
        ];

        return [
            'name' => $this->faker->name(),
            'age' => $this->faker->numberBetween(1, 95),
            'sex' => $this->faker->randomElement(['Male', 'Female']),
            'address' => $this->faker->address(),
            'cause_of_death' => $this->faker->randomElement($causes),
            'date_died' => $this->faker->dateTimeBetween('-1 week', 'now'), // A random date in the last week
            'place_of_incident' => $this->faker->city(),
            'user_id' => User::inRandomOrder()->first()->id,
        ];
    }
}
