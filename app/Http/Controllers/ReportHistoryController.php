<?php

namespace App\Http\Controllers;

use App\Models\AffectedTourist;
use App\Models\AssistanceExtended;
use App\Models\Casualty;
use App\Models\DamagedHouseReport;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PrePositioning;
use App\Models\ResponseOperation;
use App\Models\UscDeclaration;
use App\Models\WaterLevel;
use App\Services\ReportHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Response;

/**
 * The "Report History" page and data for the forms that have no history of their own.
 * Each type is gated by the same permission as its form.
 */
class ReportHistoryController extends Controller
{
    /** @var array<string, array{model: class-string, permission: string, fields: array<int, string>}> */
    private const TYPES = [
        'casualties' => [
            'model' => Casualty::class,
            'permission' => 'access-casualty-form',
            'fields' => ['name', 'age', 'sex', 'address', 'cause_of_death', 'date_died', 'place_of_incident'],
        ],
        'injured' => [
            'model' => Injured::class,
            'permission' => 'access-injured-form',
            'fields' => ['name', 'age', 'sex', 'address', 'diagnosis', 'date_admitted', 'place_of_incident', 'remarks'],
        ],
        'missing' => [
            'model' => Missing::class,
            'permission' => 'access-missing-form',
            'fields' => ['name', 'age', 'sex', 'address', 'cause', 'remarks'],
        ],
        'tourists' => [
            'model' => AffectedTourist::class,
            'permission' => 'access-tourist-form',
            'fields' => ['province_city_municipality', 'location', 'local_tourists', 'foreign_tourists', 'remarks'],
        ],
        'damaged-houses' => [
            'model' => DamagedHouseReport::class,
            'permission' => 'access-damaged-houses-form',
            'fields' => ['barangay', 'partially', 'totally', 'total'],
        ],
        'pre-positioning' => [
            'model' => PrePositioning::class,
            'permission' => 'access-pre-positioning-form',
            'fields' => ['team_units', 'team_leader', 'personnel_deployed', 'response_assets', 'capability', 'area_of_deployment'],
        ],
        'response-operations' => [
            'model' => ResponseOperation::class,
            'permission' => 'access-response-operations',
            'fields' => ['team_unit', 'incident', 'datetime', 'location', 'actions', 'remarks'],
        ],
        'assistance-extended' => [
            'model' => AssistanceExtended::class,
            'permission' => 'access-assistance-extended',
            'fields' => ['agency_officials_groups', 'type_kind_of_assistance', 'amount', 'beneficiaries'],
        ],
        'declaration' => [
            'model' => UscDeclaration::class,
            'permission' => 'access-declaration-form',
            'fields' => ['declared_by', 'resolution_number', 'date_approved'],
        ],
        'water-level' => [
            'model' => WaterLevel::class,
            'permission' => 'access-water-level-form',
            'fields' => ['gauging_station', 'current_level', 'alarm_level', 'critical_level', 'affected_areas'],
        ],
    ];

    /** The history types served here, for the route constraint. */
    public static function types(): array
    {
        return array_keys(self::TYPES);
    }

    public function page(string $type): Response
    {
        $this->authorizeType($type);

        return inertia('ReportHistory/Index', ['type' => $type]);
    }

    public function data(string $type): JsonResponse
    {
        $config = $this->authorizeType($type);

        return response()->json(ReportHistory::forUser($config['model'], $config['fields'], Auth::user()));
    }

    private function authorizeType(string $type): array
    {
        $config = self::TYPES[$type] ?? abort(404);
        $user = Auth::user();
        abort_unless($user->isAdmin() || $user->can($config['permission']), 403);

        return $config;
    }
}
