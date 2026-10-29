<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Shortest password accepted when one is set or changed. Phones keep a check of it for
     * unlocking the app offline (lib/offline/lock.js), which a thief could guess at without limits.
     */
    public const PASSWORD_MIN_LENGTH = 12;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    /** Where this user lands after login: only admins have a dashboard. */
    public function homeRoute(): string
    {
        return $this->isAdmin() ? 'dashboard' : 'situation-reports.index';
    }

    /**
     * The account as the browser sees it. Inertia prints this into every page's HTML, so only
     * what the UI reads, never the whole model with its pivot rows.
     *
     * @return array<string, mixed>
     */
    public function forPage(): array
    {
        $this->loadMissing('roles:id,name', 'permissions:id,name');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // The profile form checks this to decide whether to show the verify-email notice.
            'email_verified_at' => $this->email_verified_at,
            'roles' => $this->roles->map(fn ($role) => ['name' => $role->name])->values(),
            'permissions' => $this->permissions->map(fn ($permission) => ['name' => $permission->name])->values(),
        ];
    }

    /**
     * Sign this account out on its devices, except the session $keep (the device making the
     * change). Their "Remember me" cookies stop working once the password changes, since each
     * cookie carries the password hash; this ends the sessions that are still open.
     */
    public function endSessions(?string $keep = null): void
    {
        DB::table('sessions')->where('user_id', $this->id)->when($keep, fn ($query) => $query->where('id', '!=', $keep))->delete();
    }

    public function isUser()
    {
        return $this->hasRole('user');
    }

    /**
     * Users whose data this user can access (users who have shared with this user)
     */
    public function sharedDataFrom()
    {
        return $this->belongsToMany(
            User::class,
            'user_data_sharing',
            'shared_with_user_id',
            'user_id'
        )->withPivot('permission_type')->withTimestamps();
    }

    /**
     * Users this user has shared data with
     */
    public function sharingDataWith()
    {
        return $this->belongsToMany(
            User::class,
            'user_data_sharing',
            'user_id',
            'shared_with_user_id'
        )->withPivot('permission_type')->withTimestamps();
    }

    /**
     * Check if this user can access another user's data
     *
     * @param  int  $userId  The user ID whose data to check
     * @param  string  $permissionType  'read' or 'write'
     * @return bool
     */
    public function canAccessUserData($userId, $permissionType = 'read')
    {
        // Admin can access all data
        if ($this->isAdmin()) {
            return true;
        }

        // User can access their own data
        if ($this->id == $userId) {
            return true;
        }

        // Check if data is shared with this user
        $sharing = \DB::table('user_data_sharing')
            ->where('user_id', $userId)
            ->where('shared_with_user_id', $this->id)
            ->first();

        if (! $sharing) {
            return false;
        }

        // If checking for write access, the permission must be 'write'
        if ($permissionType === 'write') {
            return $sharing->permission_type === 'write';
        }

        // For read access, both 'read' and 'write' permissions work
        return true;
    }

    /**
     * Get all user IDs whose data this user can access
     *
     * @param  string  $permissionType  'read' or 'write'
     * @return array
     */
    public function getAccessibleUserIds($permissionType = 'read')
    {
        // Admin can access all users' data
        if ($this->isAdmin()) {
            // withTrashed: reports by deleted accounts are kept, so admins must still see them.
            return User::withTrashed()->pluck('id')->toArray();
        }

        $query = \DB::table('user_data_sharing')
            ->where('shared_with_user_id', $this->id);

        // If checking for write access, filter by permission type
        if ($permissionType === 'write') {
            $query->where('permission_type', 'write');
        }

        $sharedUserIds = $query->pluck('user_id')->toArray();

        // Always include the user's own ID
        $sharedUserIds[] = $this->id;

        return array_unique($sharedUserIds);
    }
}
