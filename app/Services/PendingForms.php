<?php

namespace App\Services;

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
        'access-water-level-form' => 'water_levels',
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
        'access-affected-tourists-form' => 'affected_tourists',
        'access-assistance-provided-lgus-form' => 'assistance_provided_lgus',
        'access-suspension-classes-form' => 'suspension_of_classes',
        'access-suspension-work-form' => 'suspension_of_works',
    ];

    /** The name shown for a report table. */
    public static function label(string $table): string
    {
        return $table === self::AGRICULTURE_TABLE ? 'Agriculture Report' : (self::FORM_TABLES[$table] ?? $table);
    }

    /**
     * The tables still to submit, given the account's permissions and the tables it has submitted.
     *
     * @param  array<int, string>  $permissions
     * @param  array<int, string>  $submittedTables
     * @return array<int, string> report tables, in the order of $permissions
     */
    public static function missing(array $permissions, array $submittedTables): array
    {
        $tables = array_filter(array_map(fn (string $permission) => self::PERMISSION_TABLES[$permission] ?? null, $permissions));

        return array_values(array_diff(array_unique($tables), $submittedTables));
    }

    /**
     * The tables still to submit for each of the given accounts (permissions must be loaded).
     * One query per form, however many accounts there are.
     *
     * @param  iterable<User>  $users
     * @return array<int, array<int, string>> account id => report tables
     */
    public static function missingForUsers(iterable $users, Typhoon $disaster): array
    {
        $filedBy = [];
        foreach (array_keys(self::FORM_TABLES) as $table) {
            foreach (DB::table($table)->where('disaster_id', $disaster->id)->whereNotNull('user_id')->distinct()->pluck('user_id') as $userId) {
                $filedBy[$userId][] = $table;
            }
        }
        $agricultureFiled = DB::table(self::AGRICULTURE_TABLE)->where('disaster_id', $disaster->id)->exists();

        $missing = [];
        foreach ($users as $user) {
            $filed = $filedBy[$user->id] ?? [];
            if ($agricultureFiled) {
                $filed[] = self::AGRICULTURE_TABLE;
            }
            $missing[$user->id] = self::missing($user->permissions->pluck('name')->all(), $filed);
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
            $isShared = $table === self::AGRICULTURE_TABLE;
            $selects[] = 'select ? as table_name from (select 1) as probe where exists (select 1 from '.$grammar->wrapTable($table).' where disaster_id = ?'.($isShared ? '' : ' and user_id = ?').')';
            array_push($bindings, $table, $disaster->id, ...($isShared ? [] : [$user->id]));
        }

        return array_column(DB::select(implode(' union all ', $selects), $bindings), 'table_name');
    }
}
