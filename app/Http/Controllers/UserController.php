<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index()
    {
        // Only the columns the page shows; roles and permissions by name only.
        $users = User::with(['roles:id,name', 'permissions:id,name'])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'created_at', 'offline_hash'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->permissions->pluck('name'),
                    'created_at' => $user->created_at->format('M d, Y'),
                    // Whether a phone can be prepared for it yet (never the check itself).
                    'offlineReady' => $user->offline_hash !== null,
                ];
            });

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
            // These never change from this page, so saving a user skips them.
            'roles' => fn () => Role::all(['id', 'name']),
            'permissions' => fn () => Permission::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->withoutTrashed()],
            'password' => ['required', Password::defaults()],
            'role' => ['required', 'string', Rule::in(Role::pluck('name')->toArray())],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permission::pluck('name')->toArray())],
        ]);

        // A deleted account still holds its email, so bring it back (with its old reports) instead of colliding with it.
        $user = User::onlyTrashed()->firstWhere('email', $validated['email']) ?? new User(['email' => $validated['email']]);
        $user->fill(['name' => $validated['name'], 'password' => Hash::make($validated['password'])]);
        $user->deleted_at = null;
        // New token: a "remember me" cookie left on the deleted account's old devices must not log in again.
        $user->setRememberToken(Str::random(60));
        $user->save();
        $user->rememberOfflinePassword($validated['password']);

        // sync, not assign: a restored account must not keep its old role or permissions.
        $user->syncRoles([$validated['role']]);
        $user->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', Password::defaults()],
            'role' => ['required', 'string', Rule::in(Role::pluck('name')->toArray())],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permission::pluck('name')->toArray())],
        ]);

        // Track old permissions for audit log
        $oldPermissions = $user->permissions->pluck('name')->toArray();
        $oldRoles = $user->roles->pluck('name')->toArray();

        // Update basic info
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        // Update password if provided
        if (! empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
            $user->rememberOfflinePassword($validated['password']);

            // Log password change
            AuditLogger::logPasswordChange(
                userId: $user->id,
                description: "Password changed for user: {$user->name} ({$user->email})"
            );

            // The admin's way to shut out a lost phone: every device of the account must sign in
            // again with the new password (but not the admin's own session, if editing themselves).
            $user->endSessions($user->is($request->user()) ? $request->session()->getId() : null);
        }

        // Sync role (remove old roles and assign new one)
        $user->syncRoles([$validated['role']]);

        // Sync permissions
        $newPermissions = $validated['permissions'] ?? [];
        if (isset($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        } else {
            $user->syncPermissions([]);
        }

        // Log permission/role changes if they changed
        $newRoles = [$validated['role']];
        if ($oldRoles != $newRoles || $oldPermissions != $newPermissions) {
            AuditLogger::logPermissionChange(
                user: $user,
                oldPermissions: ['roles' => $oldRoles, 'permissions' => $oldPermissions],
                newPermissions: ['roles' => $newRoles, 'permissions' => $newPermissions],
                description: "Permissions/roles updated for user: {$user->name} ({$user->email})"
            );
        }

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user
     */
    public function destroy(Request $request, User $user)
    {
        // Deleting can't be undone: the admin re-enters their password, so an unattended session can't do it.
        $request->validate(['password' => ['required', 'current_password']]);

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')->with('error', 'You cannot delete your own account.');
        }

        $user->delete();
        // A deleted account can be restored later; its old phones must not come back logged in.
        $user->endSessions();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }
}
