<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Weather is PAGASA's forecast for Ilagan, entered by CDRRMO or an admin, so barangay
 * accounts (@barangay.local) no longer file it. Their other forms are untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Permission::where('name', 'access-weather-form')->exists()) {
            return;
        }

        // Eloquent, not DB::table, so Spatie's permission cache is cleared too.
        User::where('email', 'like', '%@barangay.local')->permission('access-weather-form')->get()
            ->each(fn (User $user) => $user->revokePermissionTo('access-weather-form'));
    }

    public function down(): void
    {
        if (! Permission::where('name', 'access-weather-form')->exists()) {
            return;
        }

        User::where('email', 'like', '%@barangay.local')->get()
            ->each(fn (User $user) => $user->givePermissionTo('access-weather-form'));
    }
};
