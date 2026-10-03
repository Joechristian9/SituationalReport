<?php

namespace Database\Seeders;

use App\Models\Injured;
use App\Models\Typhoon;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo Dead / Injured / Missing records submitted by the barangay accounts, so the
 * dashboard charts have realistic data to show. Local/demo use only:
 *
 *   php artisan db:seed --class=HumanImpactDemoSeeder
 *
 * - Every barangay account submits at least one record; a few flood-prone
 *   barangays submit more.
 * - Records are spread over the disaster's first days, peaking around landfall.
 * - Deterministic (fixed random seed) and skipped if barangay records already exist.
 */
class HumanImpactDemoSeeder extends Seeder
{
    private const SEED = 20261003;

    private const MALE = ['Juan', 'Jose', 'Mark', 'John Paul', 'Rogelio', 'Ernesto', 'Romeo', 'Danilo', 'Rodel', 'Jerome', 'Christian', 'Arnel', 'Reynaldo', 'Noel', 'Ricardo', 'Jayson', 'Elmer', 'Benjie', 'Carlo', 'Joel', 'Eduardo', 'Felipe', 'Wilfredo', 'Marvin', 'Angelo', 'Renato', 'Alfredo', 'Dominador', 'Kevin', 'Jericho'];

    private const FEMALE = ['Maria', 'Ana', 'Rosario', 'Teresita', 'Jocelyn', 'Marites', 'Lorna', 'Cristina', 'Evelyn', 'Gloria', 'Angelica', 'Jennifer', 'Rowena', 'Luzviminda', 'Marilou', 'Liza', 'Erlinda', 'Nenita', 'Kristine', 'Princess', 'Aileen', 'Remedios', 'Josephine', 'Imelda', 'Leonora', 'Charmaine', 'Rachelle', 'Divina', 'Mylene', 'Shiela'];

    private const SURNAMES = ['Dela Cruz', 'Bautista', 'Garcia', 'Reyes', 'Santos', 'Ramos', 'Mendoza', 'Aquino', 'Agustin', 'Pascual', 'Domingo', 'Castillo', 'Tumaliuan', 'Taguinod', 'Baquiran', 'Binag', 'Guzman', 'Mallillin', 'Cabildo', 'Pagulayan', 'Aggabao', 'Furigay', 'Tamayo', 'Respicio', 'Andres', 'Ventura', 'Soriano', 'Villanueva', 'Galang', 'Abad', 'Lappay', 'Talosig', 'Sibal', 'Maddela', 'Ancheta', 'Dumlao', 'Caranguian', 'Battung', 'Cauilan', 'Gumabay'];

    private const HOTSPOTS = ['Alibagu', 'Baligatan', 'Bagumbayan', 'San Felipe', 'Santa Barbara', 'Minabang', 'Fugu', 'Bigao', 'Calamagui 1st', 'Camunatan', 'Rugao', 'Sindon Bayabo'];

    private const CAUSES_OF_DEATH = [
        'Drowning due to flash flood', 'Drowning while crossing the Ilagan River', 'Swept away by strong current',
        'Buried by landslide', 'Crushed by fallen tree', 'Crushed by collapsed wall', 'Electrocution from downed power line',
        'Hit by flying debris (G.I. sheet)', 'Hypothermia after prolonged exposure to flood water', 'Heart attack during evacuation',
        'Head injury from collapsed house roof', 'Leptospirosis complications after flood exposure',
    ];

    private const DIAGNOSES = [
        'Lacerated wound, left leg', 'Lacerated wound, forehead', 'Fractured right arm', 'Fractured left leg', 'Fractured ribs, chest contusion',
        'Head trauma, multiple contusions', 'Sprained ankle, abrasions', 'Dislocated shoulder', 'Puncture wound from nail (flood debris)',
        'Hypothermia, exhaustion', 'Near-drowning, aspiration', 'Burn from electrical spark', 'Back injury from fall during evacuation',
        'Crushed foot, multiple fractures', 'Deep lacerations on both legs', 'Abrasions and contusions, multiple sites',
        'Dog bite during evacuation', 'Fever and diarrhea after flood exposure',
    ];

    private const PLACES = ['along the Ilagan River bank', 'near the Cagayan River dike', 'at the barangay road', 'inside their house',
        'at the rice field', 'near the spillway', 'at the evacuation center', 'on the way to the evacuation center', 'at the hillside sitio'];

    private const CARE = ['Admitted at the provincial hospital', 'Treated and released at the City Health Office', 'Under observation at the Barangay Health Station',
        'Brought to the hospital by the CDRRMO rescue team', 'Treated on site by BFP medics', 'Admitted, now in stable condition', 'Transferred to a hospital in Santiago City'];

    private const MISSING_CAUSES = [
        'Swept by strong current while crossing the flooded river', 'Last seen fishing before the river rose', 'Went to check on livestock during height of storm, did not return',
        'Separated from family during flash flood evacuation', 'Last seen on the riverbank securing a banca', 'Did not reach the evacuation center',
        'Lost contact during landslide incident', 'Last seen on a motorcycle crossing the overflow bridge',
    ];

    private const MISSING_REMARKS = ['Search and rescue ongoing (CDRRMO, BFP, PNP)', 'Family reported to barangay hall', 'Coast Guard and volunteers searching downstream',
        'Search suspended due to strong current, to resume at daylight', 'Relatives checking evacuation centers'];

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('HumanImpactDemoSeeder is for local/demo use only. Aborting.');

            return;
        }

        $disaster = Typhoon::whereIn('status', ['active', 'paused'])->latest('id')->first();
        if (! $disaster) {
            $this->command->error('No active or paused disaster. Create one first.');

            return;
        }

        $barangays = User::where('email', 'like', '%@barangay.local')->orderBy('name')->get(['id', 'name']);
        if ($barangays->isEmpty()) {
            $this->command->error('No barangay accounts. Run BarangaySeeder first.');

            return;
        }

        $tables = ['casualties', (new Injured)->getTable(), 'missing'];
        $existing = collect($tables)->sum(fn ($t) => DB::table($t)->where('disaster_id', $disaster->id)->whereIn('user_id', $barangays->pluck('id'))->count());
        if ($existing > 0) {
            $this->command->warn("Barangay records already exist for {$disaster->name} ({$existing}). Skipping to avoid duplicates.");

            return;
        }

        mt_srand(self::SEED);

        // Five report days starting at the disaster (or 4 days ago), peaking on landfall day.
        $start = Carbon::parse($disaster->started_at ?? now())->startOfDay();
        $start = $start->min(now()->subDays(4)->startOfDay());
        $dayWeights = [15, 35, 25, 15, 10];

        $rows = ['dead' => [], 'injured' => [], 'missing' => []];

        foreach ($barangays as $barangay) {
            $count = in_array($barangay->name, self::HOTSPOTS, true) ? mt_rand(4, 8) : mt_rand(1, 2);

            for ($i = 0; $i < $count; $i++) {
                $type = $this->weighted(['dead' => 20, 'injured' => 65, 'missing' => 15]);
                $reportedAt = $this->reportTime($start, $dayWeights);
                $rows[$type][] = $this->person($type, $barangay, $disaster->id, $reportedAt);
            }
        }

        DB::transaction(function () use ($rows, $tables) {
            foreach (array_combine(['dead', 'injured', 'missing'], $tables) as $type => $table) {
                foreach (array_chunk($rows[$type], 100) as $chunk) {
                    DB::table($table)->insert($chunk);
                }
            }
        });

        $total = count($rows['dead']) + count($rows['injured']) + count($rows['missing']);
        $this->command->info(sprintf(
            'Seeded %d records for %s from %d barangays: %d dead, %d injured, %d missing.',
            $total, $disaster->name, $barangays->count(), count($rows['dead']), count($rows['injured']), count($rows['missing'])
        ));
    }

    private function person(string $type, User $barangay, int $disasterId, Carbon $reportedAt): array
    {
        $sexRoll = mt_rand(1, 100);
        $sex = $sexRoll <= 52 ? 'male' : ($sexRoll <= 97 ? 'female' : null);
        $first = $this->pick($sex === 'female' ? self::FEMALE : self::MALE);
        $middle = chr(mt_rand(65, 90)).'.';
        $name = "{$first} {$middle} {$this->pick(self::SURNAMES)}";
        $age = $this->weighted(['child' => 18, 'young' => 25, 'adult' => 35, 'senior' => 22]);
        $age = match ($age) {
            'child' => mt_rand(1, 17),
            'young' => mt_rand(18, 30),
            'adult' => mt_rand(31, 59),
            default => mt_rand(60, 88),
        };
        $address = 'Purok '.mt_rand(1, 7).", Brgy. {$barangay->name}, Ilagan City, Isabela";
        $place = ucfirst($this->pick(self::PLACES)).", Brgy. {$barangay->name}";

        $base = [
            'name' => $name,
            'age' => mt_rand(1, 100) <= 4 ? null : $age,
            'sex' => $sex,
            'address' => $address,
            'disaster_id' => $disasterId,
            'user_id' => $barangay->id,
            'created_at' => $reportedAt,
            'updated_at' => $reportedAt,
        ];

        return match ($type) {
            'dead' => $base + [
                'cause_of_death' => $this->pick(self::CAUSES_OF_DEATH),
                'date_died' => $reportedAt->copy()->subHours(mt_rand(0, 20))->toDateString(),
                'place_of_incident' => $place,
            ],
            'injured' => $base + [
                'diagnosis' => $this->pick(self::DIAGNOSES),
                'date_admitted' => $reportedAt->toDateString(),
                'place_of_incident' => $place,
                'remarks' => $this->pick(self::CARE),
            ],
            'missing' => $base + [
                'cause' => $this->pick(self::MISSING_CAUSES),
                'remarks' => $this->pick(self::MISSING_REMARKS),
            ],
        };
    }

    private function reportTime(Carbon $start, array $dayWeights): Carbon
    {
        $day = (int) $this->weighted(array_combine(array_keys($dayWeights), $dayWeights));
        $time = $start->copy()->addDays($day)->setTime(mt_rand(6, 21), mt_rand(0, 59));

        return $time->greaterThan(now()) ? now()->subMinutes(mt_rand(5, 300)) : $time;
    }

    private function weighted(array $weights): string|int
    {
        $roll = mt_rand(1, array_sum($weights));
        foreach ($weights as $key => $weight) {
            if (($roll -= $weight) <= 0) {
                return $key;
            }
        }

        return array_key_first($weights);
    }

    private function pick(array $items): string
    {
        return $items[mt_rand(0, count($items) - 1)];
    }
}
