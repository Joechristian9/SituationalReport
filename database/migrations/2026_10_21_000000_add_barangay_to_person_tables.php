<?php

use App\Services\Barangays;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Dead, injured and missing persons get the barangay they belong to (chosen from the barangay
 * accounts), so they can be counted per barangay like damaged houses and evacuations.
 */
return new class extends Migration
{
    private const TABLES = ['casualties', 'injureds', 'missing'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->string('barangay')->nullable()->after('address')->index();
            });
        }

        $this->backfill();
    }

    /**
     * Existing rows: the barangay named in the address ("Brgy. Aggasian"), otherwise the barangay
     * account that reported it; rows from city offices with no barangay in the address stay empty.
     * One-off system fill, so it writes directly instead of through the audited models.
     */
    public function backfill(): void
    {
        $accounts = Barangays::accounts();

        foreach (self::TABLES as $table) {
            DB::table($table)->whereNull('barangay')->select(['id', 'address', 'user_id'])->orderBy('id')
                ->chunkById(500, function ($rows) use ($table, $accounts) {
                    $idsByBarangay = [];
                    foreach ($rows as $row) {
                        $barangay = Barangays::fromAddress($row->address) ?? $accounts->get($row->user_id)?->name;
                        if ($barangay) {
                            $idsByBarangay[$barangay][] = $row->id;
                        }
                    }
                    foreach ($idsByBarangay as $barangay => $ids) {
                        DB::table($table)->whereIn('id', $ids)->update(['barangay' => $barangay]);
                    }
                });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropIndex(['barangay']);
                $blueprint->dropColumn('barangay');
            });
        }
    }
};
