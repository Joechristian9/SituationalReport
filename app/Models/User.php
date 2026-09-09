<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

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
     * @param int $userId The user ID whose data to check
     * @param string $permissionType 'read' or 'write'
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

        if (!$sharing) {
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
     * @param string $permissionType 'read' or 'write'
     * @return array
     */
    public function getAccessibleUserIds($permissionType = 'read')
    {
        // Admin can access all users' data
        if ($this->isAdmin()) {
            return User::pluck('id')->toArray();
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
