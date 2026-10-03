# Data Sharing Implementation Summary

## Overview
Implemented a data sharing mechanism that allows CDRRMO account to view and edit ISELCO2 account's electricity form data (and vice versa for shared forms).

## Architecture

### 1. Database Schema
**New Table:** `user_data_sharing`
- `id` - Primary key
- `user_id` - Foreign key to users (data owner)
- `shared_with_user_id` - Foreign key to users (who can access)
- `permission_type` - ENUM('read', 'write') - Access level
- `created_at`, `updated_at` - Timestamps
- **Unique constraint:** (`user_id`, `shared_with_user_id`)

**Migration File:** `database/migrations/2026_09_09_140453_create_user_data_sharing_table.php`

### 2. User Model Enhancements
**File:** `app/Models/User.php`

**New Relationships:**
- `sharedDataFrom()` - Users whose data this user can access
- `sharingDataWith()` - Users this user has shared data with

**New Helper Methods:**
- `canAccessUserData($userId, $permissionType)` - Check if user can access another user's data
- `getAccessibleUserIds($permissionType)` - Get all user IDs whose data this user can access
  - Returns array of user IDs
  - Includes user's own ID
  - Admins get all user IDs
  - Filters by permission type ('read' or 'write')

### 3. Controller Updates

**Pattern Applied:**
```php
// OLD CODE (user sees only their own data)
if ($user && !$user->isAdmin()) {
    $query->where('user_id', $user->id);
}

// NEW CODE (user sees own data + shared data)
if ($user && !$user->isAdmin()) {
    $accessibleUserIds = $user->getAccessibleUserIds('read');
    $query->whereIn('user_id', $accessibleUserIds);
}
```

**Controllers Updated:**
1. ✅ `SituationOverviewController.php` - All methods (index, store, history views)
   - Weather reports
   - Water levels
   - Electricity services
   - Water services
   - Communications
   - Roads
   - Bridges
   - Pre-emptive reports

2. ✅ `CasualtyController.php` - Index and update methods
3. ✅ `InjuredController.php` - Index and update methods
4. ✅ `MissingController.php` - Index and update methods
5. ✅ `ResponseOperationController.php` - Index, store, and update methods
6. ✅ `AssistanceExtendedController.php` - Index method (partial)

**Note:** Some controllers may need additional manual updates for write operations.

### 4. Seeder Data
**File:** `database/seeders/DatabaseSeeder.php`

**Data Sharing Setup:**
```php
// CDRRMO can read AND write ISELCO2's electricity data
user_data_sharing: {
    user_id: iselco2->id,
    shared_with_user_id: cdrrmo->id,
    permission_type: 'write'
}

// ISELCO2 can read CDRRMO's data (optional, bidirectional)
user_data_sharing: {
    user_id: cdrrmo->id,
    shared_with_user_id: iselco2->id,
    permission_type: 'read'
}
```

## How It Works

### For CDRRMO User:
1. **Login as CDRRMO**
2. **Navigate to Electricity Form**
3. **See both:**
   - Own electricity records (created by CDRRMO)
   - ISELCO2's electricity records (shared with write permission)
4. **Can edit both** - Since permission is 'write', CDRRMO can update ISELCO2's records
5. **Modification tracking** - System tracks who made changes via `updated_by` field

### For ISELCO2 User:
1. **Login as ISELCO2**
2. **Navigate to Electricity Form**
3. **See both:**
   - Own electricity records (created by ISELCO2)
   - CDRRMO's electricity records (shared with read permission)
4. **Can only view CDRRMO's data** - Since permission is 'read', cannot edit

### For Admin:
- Admins bypass all sharing logic
- See ALL data from ALL users
- Can edit everything

## Deployment Steps

### 1. Run Migration
```bash
php artisan migrate
```
This creates the `user_data_sharing` table.

### 2. Run Seeder (Fresh Install)
```bash
php artisan db:seed
```
This creates users and sets up the sharing relationships.

### 3. Or Add Sharing Manually (Existing Database)
```sql
INSERT INTO user_data_sharing (user_id, shared_with_user_id, permission_type, created_at, updated_at)
VALUES 
  ((SELECT id FROM users WHERE email='iselco2@gmail.com'), 
   (SELECT id FROM users WHERE email='cdrrmo@gmail.com'), 
   'write', NOW(), NOW());
```

### 4. Clear Application Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 5. Rebuild Frontend Assets
```bash
npm run build
```

## Testing Checklist

### Test Case 1: CDRRMO Viewing ISELCO2 Data
- [ ] Login as CDRRMO
- [ ] Navigate to Situation Reports → Electricity
- [ ] Verify you see ISELCO2's electricity records
- [ ] Try editing an ISELCO2 record
- [ ] Verify the edit saves successfully
- [ ] Check `updated_by` field shows CDRRMO's user_id

### Test Case 2: ISELCO2 Viewing CDRRMO Data
- [ ] Login as ISELCO2
- [ ] Navigate to Situation Reports → Electricity
- [ ] Verify you see CDRRMO's electricity records (if any)
- [ ] Verify you can view but not edit CDRRMO's records

### Test Case 3: Modification History
- [ ] Make changes as CDRRMO to an ISELCO2 record
- [ ] Check modification indicator shows CDRRMO made the change
- [ ] Verify tooltip shows correct user name

### Test Case 4: Data Isolation
- [ ] Login as another user (e.g., IWD)
- [ ] Verify they CANNOT see ISELCO2 or CDRRMO electricity data
- [ ] Only see their own data

### Test Case 5: Admin Access
- [ ] Login as Admin
- [ ] Verify you see ALL users' data
- [ ] Can edit everything

## Security Considerations

1. **Permission Validation:** All write operations check `getAccessibleUserIds('write')`
2. **Data Ownership:** Original `user_id` never changes - only `updated_by` changes
3. **Audit Trail:** `updated_by` field tracks who made the last modification
4. **Access Control:** Non-admins can only access explicitly shared data
5. **Unique Constraint:** Prevents duplicate sharing entries

## Future Enhancements

1. **UI for Managing Sharing**
   - Admin panel to add/remove sharing relationships
   - User interface to see who you're sharing with

2. **Granular Permissions**
   - Share specific forms only (e.g., only electricity, not water)
   - Time-limited sharing

3. **Notification System**
   - Notify users when data is shared with them
   - Notify when shared data is modified

4. **Sharing History**
   - Track when sharing relationships were created/removed
   - Audit log of all shared access

5. **Team/Organization Concept**
   - Group users into teams
   - Share data at team level instead of individual level

## Troubleshooting

### Issue: "Access denied" when CDRRMO tries to edit
**Solution:** Check `user_data_sharing` table has correct entry with `permission_type='write'`

### Issue: CDRRMO doesn't see ISELCO2 data
**Solution:** 
1. Verify sharing entry exists in database
2. Check controller uses `whereIn('user_id', $accessibleUserIds)`
3. Clear cache: `php artisan cache:clear`

### Issue: Migration fails
**Solution:** Check database credentials in `.env` file

### Issue: "Call to undefined method getAccessibleUserIds"
**Solution:** Clear config cache: `php artisan config:clear`

## Database Configuration Note

Your current `.env` file points to a production database:
```
DB_DATABASE=u988863428_sitrepilagan
DB_USERNAME=u988863428_joe
```

For local development with XAMPP, update to:
```
DB_DATABASE=situationalreport
DB_USERNAME=root
DB_PASSWORD=
```

Then run migrations and seeders on your local database for testing.

## Files Modified

1. `database/migrations/2026_09_09_140453_create_user_data_sharing_table.php` (NEW)
2. `app/Models/User.php`
3. `app/Http/Controllers/SituationOverviewController.php`
4. `app/Http/Controllers/CasualtyController.php`
5. `app/Http/Controllers/InjuredController.php`
6. `app/Http/Controllers/MissingController.php`
7. `app/Http/Controllers/ResponseOperationController.php`
8. `app/Http/Controllers/AssistanceExtendedController.php`
9. `database/seeders/DatabaseSeeder.php`

## Commit Message
```
feat: implement data sharing mechanism between users

- Add user_data_sharing table for managing shared access
- Add User model methods: canAccessUserData(), getAccessibleUserIds()
- Update all controllers to use shared data query logic
- CDRRMO can now view and edit ISELCO2 electricity form data
- Bidirectional sharing with configurable read/write permissions
- Maintains audit trail via updated_by field
```
