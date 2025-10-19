<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Injured; // Make sure your model is named correctly
use App\Models\User;

class InjuredFactory extends Factory
{
    protected $model = Injured::class;

    public function definition(): array
    {
        $diagnoses = [
            'Laceration',
            'Fracture',
            'Contusion',
            'Abrasion',
            'Puncture Wound',
            'Hypothermia',
            'Dehydration',
            'Burn'
        ];

        return [
            'name' => $this->faker->name(),
            'age' => $this->faker->numberBetween(1, 95),
            'sex' => $this->faker->randomElement(['Male', 'Female']),
            'address' => $this->faker->address(),
            'diagnosis' => $this->faker->randomElement($diagnoses),
            'date_admitted' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'place_of_incident' => $this->faker->streetName(),
            'remarks' => $this->faker->sentence(),
            'user_id' => User::inRandomOrder()->first()->id,
        ];
    }
}
