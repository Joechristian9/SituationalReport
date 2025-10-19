<?php

namespace Database\Factories;

use App\Models\PreEmptiveReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PreEmptiveReport>
 */
class PreEmptiveReportFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = PreEmptiveReport::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Define some realistic sample data
        $barangays = [
            'Suklayin',
            'Zabali',
            'Sabang',
            'Buhangin',
            'Pingit',
            'Reserva',
            'Obligacion',
            'Ditale',
            'Dibacong',
            'Calaocan'
        ];
        $evacCenters = ['Central School', 'Municipal Gym', 'Brgy. Hall', 'Covered Court', 'Church'];

        // Generate realistic numbers for families and persons inside evacuation centers
        $famInside = $this->faker->numberBetween(5, 70);
        $personsInside = $famInside * $this->faker->numberBetween(2, 5); // Avg 2-5 people per family

        // Generate realistic numbers for those outside centers (e.g., with relatives)
        $famOutside = $this->faker->numberBetween(0, 30);
        $personsOutside = $famOutside * $this->faker->numberBetween(2, 5);

        return [
            'barangay' => $this->faker->randomElement($barangays),
            'evacuation_center' => $this->faker->randomElement($evacCenters),
            'families' => $famInside,
            'persons' => $personsInside,
            'outside_center' => 'Relatives/Friends House',
            'outside_families' => $famOutside,
            'outside_persons' => $personsOutside,
            'total_families' => $famInside + $famOutside, // Automatically calculate total
            'total_persons' => $personsInside + $personsOutside, // Automatically calculate total
            'user_id' => User::inRandomOrder()->first()->id,
        ];
    }
}
