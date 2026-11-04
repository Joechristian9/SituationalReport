<?php

use App\Http\Controllers\ReportController;
use App\Models\Casualty;
use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\CommunicationServiceValue;
use App\Models\DamagedHouseReport;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;

function yearlyDisaster(): Typhoon
{
    return Typhoon::create(['name' => 'Storm', 'status' => 'active', 'started_at' => now(), 'created_by' => userWithRole('admin')->id]);
}

/** $count evacuation rows and damaged-house rows, each counting 1 of everything. */
function fillYearlyReport(int $count, Typhoon $disaster): void
{
    $now = now();
    foreach (array_chunk(range(1, $count), 200) as $chunk) {
        PreEmptiveReport::insert(array_map(fn () => [
            'disaster_id' => $disaster->id, 'user_id' => $disaster->created_by, 'barangay' => 'Alibagu', 'families' => 1, 'persons' => 1, 'outside_families' => 1, 'outside_persons' => 1,
            'total_families' => 2, 'total_persons' => 2, 'created_at' => $now, 'updated_at' => $now,
        ], $chunk));
        DamagedHouseReport::insert(array_map(fn () => [
            'disaster_id' => $disaster->id, 'user_id' => $disaster->created_by, 'barangay' => 'Alibagu', 'partially' => 1, 'totally' => 2, 'total' => 3, 'created_at' => $now, 'updated_at' => $now,
        ], $chunk));
    }
}

it('totals every row of the year even when the PDF lists only the latest ones', function () {
    fillYearlyReport(101, yearlyDisaster());

    $data = (new ReportController)->getReportData((int) now()->year, true);

    expect($data['preEmptiveReports'])->toHaveCount(100)
        ->and($data['preEmptiveTotals'])->toBe([
            'families' => 101, 'persons' => 101, 'outside_families' => 101, 'outside_persons' => 101, 'total_families' => 202, 'total_persons' => 202,
        ])
        ->and($data['damagedHouses'])->toHaveCount(100)
        ->and($data['grandTotalPartially'])->toBe(101)
        ->and($data['grandTotalTotally'])->toBe(202)
        ->and($data['grandTotal'])->toBe(303)
        ->and($data['cutOffNotes'])->toBe(['Pre-emptive evacuation' => 'latest 100 of 101', 'Damaged houses' => 'latest 100 of 101']);
});

it('tells the reader of the web report which sections are cut off', function () {
    fillYearlyReport(501, yearlyDisaster());

    $this->actingAs(userWithRole('user'))
        ->get(route('reports.view'))
        ->assertOk()
        ->assertSeeText('Pre-emptive evacuation: latest 500 of 501')
        ->assertSeeText('1,503'); // the damaged houses grand total: every row, not the 500 listed
});

it('leaves out the note when nothing is cut off, and agrees with the listed rows', function () {
    fillYearlyReport(100, yearlyDisaster());

    $data = (new ReportController)->getReportData((int) now()->year, true);

    expect($data['cutOffNotes'])->toBe([])
        ->and($data['preEmptiveTotals']['persons'])->toBe($data['preEmptiveReports']->sum('persons'))
        ->and($data['grandTotal'])->toBe($data['damagedHouses']->sum('total'));

    $this->actingAs(userWithRole('user'))->get(route('reports.view'))->assertOk()->assertDontSeeText('latest 100 of');
});

it('keeps every row of a disaster-scoped report', function () {
    $disaster = yearlyDisaster();
    fillYearlyReport(101, $disaster);
    fillYearlyReport(1, yearlyDisaster()); // another disaster's rows stay out

    $data = (new ReportController)->getReportData(null, true, $disaster->id);

    expect($data['preEmptiveReports'])->toHaveCount(101)
        ->and($data['preEmptiveTotals']['total_persons'])->toBe(202)
        ->and($data['grandTotal'])->toBe(303)
        ->and($data['cutOffNotes'])->toBe([]);
});

it('counts only the chosen year in the totals', function () {
    fillYearlyReport(1, yearlyDisaster());
    PreEmptiveReport::query()->update(['created_at' => now()->subYear()]);

    $data = (new ReportController)->getReportData((int) now()->year);

    expect($data['preEmptiveTotals']['persons'])->toBe(0)
        ->and($data['grandTotal'])->toBe(3);
});

it('shows zero totals for a year with no reports', function () {
    $data = (new ReportController)->getReportData(1999);

    expect($data['preEmptiveTotals'])->toBe(['families' => 0, 'persons' => 0, 'outside_families' => 0, 'outside_persons' => 0, 'total_families' => 0, 'total_persons' => 0])
        ->and($data['grandTotal'])->toBe(0);
});

// Decided on purpose: offices read the yearly report with its named victims, whatever forms
// they hold. Do not hide these columns without asking.
it('shows the named victims to an account holding none of the casualty, injured or missing permissions', function () {
    $disaster = yearlyDisaster();
    $reporter = userWithRole('user');
    Casualty::factory()->create(['disaster_id' => $disaster->id, 'user_id' => $reporter->id, 'name' => 'Named Casualty']);
    Injured::factory()->create(['disaster_id' => $disaster->id, 'user_id' => $reporter->id, 'name' => 'Named Injured']);
    Missing::factory()->create(['disaster_id' => $disaster->id, 'user_id' => $reporter->id, 'name' => 'Named Missing']);

    $this->actingAs(userWithRole('user'))
        ->get(route('reports.view'))
        ->assertOk()
        ->assertSeeText('Named Casualty')
        ->assertSeeText('Named Injured')
        ->assertSeeText('Named Missing');
});

it('prints the services added to the communication form', function () {
    $disaster = yearlyDisaster();
    $user = userWithRole('user');
    $dito = CommunicationService::create(['name' => 'DITO', 'category' => 'cellphone', 'order' => 2, 'is_active' => true]);
    $retired = CommunicationService::create(['name' => 'OLDNET', 'category' => 'internet', 'order' => 1, 'is_active' => false]);
    CommunicationService::create(['name' => 'UNUSED', 'category' => 'radio', 'order' => 3, 'is_active' => true]);
    $report = Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Up']);
    CommunicationServiceValue::create(['communication_id' => $report->id, 'service_id' => $dito->id, 'status' => 'Intermittent']);
    CommunicationServiceValue::create(['communication_id' => $report->id, 'service_id' => $retired->id, 'status' => 'Down']);

    $data = (new ReportController)->getReportData((int) now()->year);
    expect($data['communicationServices']->pluck('name')->all())->toBe(['OLDNET', 'DITO']);

    $this->actingAs($user)
        ->get(route('reports.view'))
        ->assertOk()
        ->assertSeeTextInOrder(['ADDED SERVICES', 'OLDNET', 'DITO', 'Down', 'Intermittent'])
        ->assertDontSeeText('UNUSED');
});

it('prints only the fixed communication columns when no service was added', function () {
    $disaster = yearlyDisaster();
    $user = userWithRole('user');
    Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Up']);

    $data = (new ReportController)->getReportData((int) now()->year);
    expect($data['communicationServices'])->toHaveCount(0);

    $this->actingAs($user)->get(route('reports.view'))->assertOk()->assertDontSeeText('ADDED SERVICES');
});

it('reads added communication services without one query per row', function () {
    $disaster = yearlyDisaster();
    $user = userWithRole('user');
    $service = CommunicationService::create(['name' => 'DITO', 'category' => 'cellphone', 'order' => 1, 'is_active' => true]);
    $addRow = function () use ($disaster, $user, $service) {
        $report = Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Up']);
        CommunicationServiceValue::create(['communication_id' => $report->id, 'service_id' => $service->id, 'status' => 'Up']);
    };
    $queries = function () {
        DB::flushQueryLog();
        DB::enableQueryLog();
        (new ReportController)->getReportData((int) now()->year);
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    };

    $addRow();
    $withOne = $queries();
    foreach (range(1, 4) as $ignored) {
        $addRow();
    }

    expect($queries())->toBe($withOne);
});

it('still opens the PDF download with data and when empty', function () {
    $user = userWithRole('user');

    $this->actingAs($user)->get(route('reports.download'))->assertOk()->assertDownload();

    fillYearlyReport(101, yearlyDisaster());

    $this->actingAs($user)->get(route('reports.download'))->assertOk()->assertDownload();
});
