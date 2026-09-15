<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index()
    {
        $users = User::with(['roles', 'permissions'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->permissions->pluck('name'),
                    'created_at' => $user->created_at->format('M d, Y'),
                ];
            });

        $roles = Role::all(['id', 'name']);
        $permissions = Permission::all(['id', 'name']);

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Password::defaults()],
            'role' => ['required', 'string', Rule::in(Role::pluck('name')->toArray())],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permission::pluck('name')->toArray())],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Assign role
        $user->assignRole($validated['role']);

        // Assign permissions if provided
        if (!empty($validated['permissions'])) {
            $user->givePermissionTo($validated['permissions']);
        }

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
        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
            
            // Log password change
            AuditLogger::logPasswordChange(
                userId: $user->id,
                description: "Password changed for user: {$user->name} ({$user->email})"
            );
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
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }
}
