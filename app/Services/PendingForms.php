<?php

namespace App\Services;

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Which forms an account must still submit for a disaster: the forms its permissions
 * give it, minus the ones it has already saved a record in.
 */
class PendingForms
{
    /** Report table => the name shown for the form. */
    public const FORM_TABLES = [
        'weather_reports' => 'Weather Report',
        'electricity_services' => 'Electricity Services',
        'water_services' => 'Water Services',
        'communications' => 'Communication Services',
        'pre_emptive_reports' => 'Pre-Emptive Evacuation',
        'incident_monitored' => 'Incident Monitored',
        'casualties' => 'Casualties',
        'injureds' => 'Injured',
        'missing' => 'Missing Persons',
        'pre_positionings' => 'Pre-Positioning',
        'usc_declarations' => 'USC Declaration',
        'damaged_house_reports' => 'Damaged Houses',
        'affected_tourists' => 'Affected Tourists',
        'response_operations' => 'Response Operations',
        'assistance_extendeds' => 'Assistance Extended',
        'assistance_provided_lgus' => 'Assistance Provided LGUs',
        'suspension_of_classes' => 'Suspension of Classes',
        'suspension_of_works' => 'Suspension of Work',
        'bridges' => 'Bridges',
        'roads' => 'Roads',
        'water_levels' => 'Water Levels',
    ];

    /** The agriculture list is shared by every account, so it has no per-account records. */
    public const AGRICULTURE_TABLE = 'agriculture_reports';

    /** Form permission => report table. */
    public const PERMISSION_TABLES = [
        'access-weather-form' => 'weather_reports',
        'access-electricity-form' => 'electricity_services',
        'access-water-service-form' => 'water_services',
        'access-communication-form' => 'communications',
        'access-pre-emptive-form' => 'pre_emptive_reports',
        'access-incident-form' => 'incident_monitored',
        'access-agriculture-form' => self::AGRICULTURE_TABLE,
        // No water levels: no page shows that form now (it is commented out on the Situation
        // Overview), so it could never be filed. Map 'access-water-level-form' again when it returns.
        'access-road-form' => 'roads',
        'access-bridge-form' => 'bridges',
        'access-pre-positioning-form' => 'pre_positionings',
        'access-declaration-form' => 'usc_declarations',
        'access-response-operations' => 'response_operations',
        'access-assistance-extended' => 'assistance_extendeds',
        'access-casualty-form' => 'casualties',
        'access-injured-form' => 'injureds',
        'access-missing-form' => 'missing',
        'access-damaged-houses-form' => 'damaged_house_reports',
        'access-tourist-form' => 'affected_tourists',
        'access-suspension-classes-form' => 'suspension_of_classes',
        'access-suspension-work-form' => 'suspension_of_works',
    ];

    /** Disaster type => forms it has no use for. They stay open but never count as still to submit. */
    public const NOT_NEEDED = [
        'Earthquake' => ['weather_reports', 'water_levels'],
        'Fire' => ['weather_reports', 'water_levels'],
        'Volcanic Eruption' => ['weather_reports', 'water_levels'],
    ];

    /** The name shown for a report table. */
    public static function label(string $table): string
    {
        return $table === self::AGRICULTURE_TABLE ? 'Agriculture Report' : (self::FORM_TABLES[$table] ?? $table);
    }

    /**
     * The report tables an account is assigned, once each, in the order of its permissions,
     * minus the ones the disaster's type has no use for.
     *
     * @param  array<int, string>  $permissions
     * @return array<int, string>
     */
    public static function required(array $permissions, ?string $disasterType = null): array
    {
        $tables = array_unique(array_filter(array_map(fn (string $permission) => self::PERMISSION_TABLES[$permission] ?? null, $permissions)));

        return array_values(array_diff($tables, self::NOT_NEEDED[$disasterType] ?? []));
    }

    /**
     * The tables still to submit, given the account's permissions and the tables it has submitted.
     *
     * @param  array<int, string>  $permissions
     * @param  array<int, string>  $submittedTables
     * @return array<int, string> report tables, in the order of $permissions
     */
    public static function missing(array $permissions, array $submittedTables, ?string $disasterType = null): array
    {
        return array_values(array_diff(self::required($permissions, $disasterType), $submittedTables));
    }

    /**
     * What every account has saved for the disaster, per form: one UNION query over all
     * the form tables instead of one query per table.
     *
     * @return array<int, array<string, array{count: int, last_updated: string|null}>> account id => table => figures
     */
    public static function submissionsByUser(Typhoon $disaster): array
    {
        $byUser = [];
        foreach (self::groupedSubmissions($disaster) as $row) {
            $byUser[(int) $row->user_id][$row->table_name] = [
                'count' => (int) $row->aggregate,
                'last_updated' => $row->last_updated,
            ];
        }

        return $byUser;
    }

    /**
     * The shared agriculture list for the disaster (it has no per-account records), or null
     * while it is empty. One query.
     *
     * @return array{count: int, last_updated: string|null}|null
     */
    public static function agricultureSubmission(Typhoon $disaster): ?array
    {
        $row = DB::table(self::AGRICULTURE_TABLE)
            ->where('disaster_id', $disaster->id)
            ->selectRaw('COUNT(*) as aggregate, MAX(updated_at) as last_updated')
            ->first();

        return $row && (int) $row->aggregate > 0
            ? ['count' => (int) $row->aggregate, 'last_updated' => $row->last_updated]
            : null;
    }

    /** @return array<int, object{table_name: string, user_id: int, aggregate: int, last_updated: string|null}> */
    private static function groupedSubmissions(Typhoon $disaster): array
    {
        $tables = array_keys(self::FORM_TABLES);
        $bindings = array_merge(...array_map(fn (string $table) => [$table, $disaster->id], $tables));

        try {
            return DB::select(implode(' union all ', array_map([self::class, 'countsSql'], $tables)), $bindings);
        } catch (QueryException $e) {
            // A form table missing on this install: fall back to reading the tables one by one.
            Log::warning('Form submission union failed; reading tables one by one', ['error' => $e->getMessage()]);
            $rows = [];
            foreach ($tables as $table) {
                try {
                    array_push($rows, ...DB::select(self::countsSql($table), [$table, $disaster->id]));
                } catch (QueryException) {
                    // Skip the missing table.
                }
            }

            return $rows;
        }
    }

    /**
     * One table's row count per account (bindings: table name, disaster id). Pre-emptive rows
     * also count for the barangay they name, since it sees and edits them on its form.
     */
    private static function countsSql(string $table): string
    {
        // Table names come from the constant above, never from the request.
        $grammar = DB::getQueryGrammar();
        $rows = $grammar->wrapTable($table);

        if ($table === 'pre_emptive_reports') {
            $users = $grammar->wrapTable('users');

            return "select ? as table_name, {$users}.id as user_id, COUNT(*) as aggregate, MAX({$rows}.updated_at) as last_updated from {$rows}"
                ." join {$users} on {$users}.id = {$rows}.user_id or {$users}.name = {$rows}.barangay"
                ." where {$rows}.disaster_id = ? group by {$users}.id";
        }

        return "select ? as table_name, user_id, COUNT(*) as aggregate, MAX(updated_at) as last_updated from {$rows}"
            .' where disaster_id = ? and user_id is not null group by user_id';
    }

    /**
     * The tables still to submit for each of the given accounts (permissions must be loaded).
     * Two queries, however many accounts and forms there are.
     *
     * @param  iterable<User>  $users
     * @return array<int, array<int, string>> account id => report tables
     */
    public static function missingForUsers(iterable $users, Typhoon $disaster): array
    {
        $filedBy = array_map('array_keys', self::submissionsByUser($disaster));
        $agricultureFiled = self::agricultureSubmission($disaster) !== null;

        $missing = [];
        foreach ($users as $user) {
            $filed = $filedBy[$user->id] ?? [];
            if ($agricultureFiled) {
                $filed[] = self::AGRICULTURE_TABLE;
            }
            $missing[$user->id] = self::missing($user->permissions->pluck('name')->all(), $filed, $disaster->disaster_type);
        }

        return $missing;
    }

    /**
     * The tables this account has saved a record in for the disaster. One query, however
     * many forms the account holds (the bell asks for this every minute).
     *
     * @return array<int, string> report tables
     */
    public static function submittedBy(User $user, Typhoon $disaster): array
    {
        $tables = array_values(array_unique(array_filter(array_map(
            fn (string $permission) => self::PERMISSION_TABLES[$permission] ?? null,
            $user->getPermissionNames()->all(),
        ))));
        if ($tables === []) {
            return [];
        }

        // Table names come from the constants above, never from the request.
        $grammar = DB::getQueryGrammar();
        $selects = [];
        $bindings = [];
        foreach ($tables as $table) {
            [$owner, $ownerBindings] = match ($table) {
                self::AGRICULTURE_TABLE => ['', []],
                // As in countsSql(): an office's row naming this barangay counts as filed.
                'pre_emptive_reports' => [' and (user_id = ? or barangay = ?)', [$user->id, $user->name]],
                default => [' and user_id = ?', [$user->id]],
            };
            $selects[] = 'select ? as table_name from (select 1) as probe where exists (select 1 from '.$grammar->wrapTable($table).' where disaster_id = ?'.$owner.')';
            array_push($bindings, $table, $disaster->id, ...$ownerBindings);
        }

        return array_column(DB::select(implode(' union all ', $selects), $bindings), 'table_name');
    }
}
