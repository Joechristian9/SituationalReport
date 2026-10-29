<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Suspension of classes and of work used to ride on access-incident-form. Each form now has its
 * own permission, ticked per account in User Management. Nobody gets them automatically.
 */
return new class extends Migration
{
    private const PERMISSIONS = ['access-suspension-classes-form', 'access-suspension-work-form'];

    public function up(): void
    {
        foreach (self::PERMISSIONS as $name) {
            Permission::findOrCreate($name);
        }
    }

    public function down(): void
    {
        // Eloquent, not DB::table, so Spatie's permission cache is cleared too.
        Permission::whereIn('name', self::PERMISSIONS)->get()->each->delete();
    }
};
