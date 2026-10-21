<?php

namespace App\Services;

use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * The barangays reports are credited to. Every barangay has its own user account named after
 * it, with an email ending in @barangay.local (see BarangaySeeder). Names typed on a report are
 * matched to those accounts ignoring case and extra spaces.
 */
class Barangays
{
    /**
     * Barangay accounts (not city office accounts), by name, keyed by id.
     *
     * @return Collection<int, User>
     */
    public static function accounts(): Collection
    {
        return once(fn () => User::whereHas('roles', fn ($query) => $query->where('name', 'user'))
            // whereHas, not User::role(): that throws when the role doesn't exist yet (fresh install).
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->reject(fn (User $user) => HumanImpactStats::isOffice($user))
            ->keyBy('id'));
    }

    /** @return array<int, string> */
    public static function names(): array
    {
        return self::accounts()->pluck('name')->values()->all();
    }

    public static function key(string $name): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim($name)));
    }

    /** The barangay's own name as its account spells it, or null when it is not one. */
    public static function match(?string $name): ?string
    {
        if ($name === null || trim($name) === '') {
            return null;
        }
        $byKey = once(fn () => self::accounts()->mapWithKeys(fn (User $user) => [self::key($user->name) => $user->name])->all());

        return $byKey[self::key($name)] ?? null;
    }

    /** The barangay named in an address such as "Purok 4, Brgy. Aggasian, Ilagan City", or null. */
    public static function fromAddress(?string $address): ?string
    {
        if ($address === null) {
            return null;
        }
        if (preg_match('/\b(?:brgy|bgy|barangay)\.?\s+([^,]+)/i', $address, $found) && ($name = self::match($found[1]))) {
            return $name;
        }
        // Otherwise any comma-separated part that is exactly a barangay name, e.g. "Purok 2, Alibagu".
        foreach (explode(',', $address) as $part) {
            if ($name = self::match($part)) {
                return $name;
            }
        }

        return null;
    }

    /** Home address for print: "Purok 4, Brgy. Aggasian", without repeating a barangay the address already names. */
    public static function withAddress(?string $address, ?string $barangay): string
    {
        $address = trim((string) $address);
        if (! $barangay || str_contains(self::key($address), self::key($barangay))) {
            return $address;
        }

        return $address === '' ? "Brgy. {$barangay}" : "{$address}, Brgy. {$barangay}";
    }

    /**
     * What to store for a report row: the matched name; a value already on the row (typed before
     * the list existed, and let through by rule()); or, when left empty, the reporting barangay.
     */
    public static function forRow(?string $typed, ?User $reporter): ?string
    {
        if ($name = self::match($typed)) {
            return $name;
        }
        if ($typed !== null && trim($typed) !== '') {
            return $typed;
        }

        return $reporter && self::accounts()->has($reporter->id) ? $reporter->name : null;
    }

    /**
     * Barangay values already stored on the rows a form is saving again, for rule().
     *
     * @param  class-string<Model>  $model
     * @return array<int, string>
     */
    public static function storedOn(string $model, mixed $rows): array
    {
        $ids = collect(is_array($rows) ? $rows : [])->pluck('id')->filter(fn ($id) => is_numeric($id))->all();

        return $ids ? $model::whereIn('id', $ids)->pluck('barangay')->filter()->values()->all() : [];
    }

    /**
     * Validation: one of the barangays, or empty. $keep are values already stored on the rows
     * being edited, so an old row typed before the list existed can still be saved unchanged.
     *
     * @param  array<int, string|null>  $keep
     */
    public static function rule(array $keep = []): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($keep) {
            // Not text at all: the 'string' rule beside this one already reports it.
            if (! is_string($value)) {
                return;
            }
            if (trim($value) === '' || self::match($value) || in_array($value, $keep, true)) {
                return;
            }
            $fail('Choose a barangay from the list.');
        };
    }
}
