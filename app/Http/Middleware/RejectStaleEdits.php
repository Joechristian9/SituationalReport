<?php

namespace App\Http\Middleware;

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\Bridge;
use App\Models\Casualty;
use App\Models\Communication;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\PrePositioning;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\Typhoon;
use App\Models\UscDeclaration;
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\WeatherReport;
use App\Traits\AuthorizesRecordWrites;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Two devices of one account can change the same row while offline. Each row a form sends
 * back carries the updated_at it was loaded with. When the row has changed on the server since:
 * - this device changed it too (`_changed`): the whole save is turned down (409) before
 *   anything is written, and the device asks which version to keep;
 * - this device didn't touch it: the save must not undo the other device's change, so the row
 *   gets the saved values (shared lists, rows this account may change) or is left out.
 * Only saves that ask for it are checked: `_editCheck` names the payload key of the rows.
 * The reply names rows and times only, never their values: this runs before the controllers'
 * own access rules, so it must not show rows the account may not read.
 */
class RejectStaleEdits
{
    use AuthorizesRecordWrites;

    /** Save route => the model of its rows. */
    private const MODELS = [
        'weather-reports.store' => WeatherReport::class,
        'water-level-reports.store' => WaterLevel::class,
        'electricity-reports.store' => ElectricityService::class,
        'water-service-reports.store' => WaterService::class,
        'communication-reports.store' => Communication::class,
        'road-reports.store' => Road::class,
        'bridge-reports.store' => Bridge::class,
        'pre-emptive-reports.store' => PreEmptiveReport::class,
        'declaration-usc.store' => UscDeclaration::class,
        'pre-positioning.store' => PrePositioning::class,
        'incident-monitored.store' => IncidentMonitored::class,
        'casualties.store' => Casualty::class,
        'injured.store' => Injured::class,
        'missing.store' => Missing::class,
        'affected-tourists-reports.store' => AffectedTourist::class,
        'damaged-houses-reports.store' => DamagedHouseReport::class,
        'suspension-classes-reports.store' => SuspensionOfClass::class,
        'suspension-work-reports.store' => SuspensionOfWork::class,
        'agriculture-reports.store' => AgricultureReport::class,
    ];

    /**
     * Lists the account may read in full, so a row it didn't touch can take its saved values
     * whoever wrote it: shared lists (agriculture also deletes rows left out of a save), and
     * pre-emptive, which city offices edit for every barangay.
     */
    private const SHARED = [AgricultureReport::class, WaterService::class, PreEmptiveReport::class];

    public function handle(Request $request, Closure $next): Response
    {
        $model = self::MODELS[$request->route()?->getName()] ?? null;
        $key = $request->input('_editCheck');
        $rows = is_string($key) && $key !== '' ? $request->input($key) : null;
        $disaster = Typhoon::getActiveTyphoon();
        if (! $model || ! is_array($rows) || ! $disaster) {
            return $next($request);
        }

        $ids = collect($rows)->map(fn ($row) => is_array($row) ? ($row['id'] ?? null) : null)->filter(fn ($id) => is_numeric($id));
        $saved = $ids->isEmpty() ? collect() : $model::where('disaster_id', $disaster->id)->whereIn('id', $ids)->get()->keyBy('id');

        $conflicts = [];
        foreach ($rows as $index => $row) {
            $record = is_array($row) && is_numeric($row['id'] ?? null) ? $saved->get((int) $row['id']) : null;
            if (! $record || ! self::changedSince($record, $row['updated_at'] ?? null)) {
                continue;
            }

            if (! empty($row['_changed'])) {
                $conflicts[] = [
                    'id' => $record->id,
                    'changedAt' => $record->updated_at->toIso8601String(),
                    'byYou' => (int) $record->getAttribute('updated_by') === (int) $request->user()->id,
                ];
            } elseif (in_array($model, self::SHARED, true) || $this->canWriteRecord($record)) {
                // Its saved values only: anything else it carries (like a communication's service
                // statuses) is this device's old copy and would undo the other change.
                $rows[$index] = ['id' => $record->id] + Arr::only($record->getAttributes(), array_keys($row));
            } else {
                unset($rows[$index]);
            }
        }

        if ($conflicts) {
            return response()->json([
                'message' => 'Some rows were changed on another device. Choose which version to keep, then save again.',
                'conflicts' => $conflicts,
            ], 409);
        }

        $request->merge([$key => array_values($rows)]);

        return $next($request);
    }

    private static function changedSince(Model $record, mixed $loadedAt): bool
    {
        if (! is_string($loadedAt) || ! $record->updated_at) {
            return false; // a save from before this check: nothing to compare
        }
        try {
            return $record->updated_at->getTimestamp() > Carbon::parse($loadedAt)->getTimestamp();
        } catch (Throwable) {
            return false;
        }
    }
}
