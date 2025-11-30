# Security & Permission System Update

## Overview
This update implements comprehensive permission checks across the application to ensure users can only access forms they have permission for.

## Changes Made

### 1. CDRRMO Access Restriction
**File:** `database/seeders/DatabaseSeeder.php`

Changed CDRRMO from having full access to only Weather and Communication forms:
```php
// Before: $cdrrmo->givePermissionTo(Permission::all());
// After:
$cdrrmo->givePermissionTo([
    'access-weather-form',
    'access-communication-form',
]);
```

### 2. Backend Permission Checks Added
**File:** `app/Http/Controllers/SituationOverviewController.php`

Added permission validation to ALL store methods:
- `storeWeather()` - Requires `access-weather-form`
- `storeWaterLevel()` - Requires `access-water-level-form`
- `storeElectricity()` - Requires `access-electricity-form`
- `storeWaterService()` - Requires `access-water-service-form`
- `storeCommunication()` - Requires `access-communication-form`
- `storeRoad()` - Requires `access-road-form`
- `storeBridge()` - Requires `access-bridge-form`

Added permission validation to ALL modification endpoints:
- `weatherModification()` - Requires `access-weather-form`
- `waterLevelModification()` - Requires `access-water-level-form`
- `electricityModification()` - Requires `access-electricity-form`
- `waterServiceModification()` - Requires `access-water-service-form`
- `communicationModification()` - Requires `access-communication-form`
- `roadModification()` - Requires `access-road-form`
- `bridgeModification()` - Requires `access-bridge-form`

### 3. CSRF Token Fix
**Files:** 
- `resources/js/bootstrap.js` - Added CSRF token configuration for axios
- `resources/views/app.blade.php` - Added CSRF token meta tag

This fixes the "CSRF token mismatch" error when submitting forms.

## Security Benefits

### Before
- ❌ CDRRMO had access to ALL forms
- ❌ No backend permission checks on modification endpoints
- ❌ Users could potentially bypass frontend restrictions
- ❌ CSRF token not properly configured

### After
- ✅ CDRRMO restricted to Weather and Communication only
- ✅ All store methods validate permissions
- ✅ All modification endpoints validate permissions
- ✅ Returns 403 Forbidden if user lacks permission
- ✅ Admin role bypasses all checks (as expected)
- ✅ CSRF token properly configured

## Testing

### Test Permission Enforcement

1. **CDRRMO User (Weather & Communication only)**
```
Email: cdrrmo@gmail.com
Password: wardead123
Expected: 
- ✅ Can access Weather form
- ✅ Can access Communication form
- ❌ Cannot access other forms (403 error)
```

2. **Iselco II (Electricity only)**
```
Email: iselco2@gmail.com
Password: wardead123
Expected:
- ✅ Can access Electricity form
- ❌ Cannot access other forms (403 error)
```

3. **IWD (Water Service only)**
```
Email: iwd@gmail.com
Password: wardead123
Expected:
- ✅ Can access Water Service form
- ❌ Cannot access other forms (403 error)
```

### Test CSRF Token Fix

1. Login as any user
2. Try to pause/resume a typhoon (admin only)
3. Try to submit any form
4. Expected: No "CSRF token mismatch" errors

## Implementation Steps

1. **Refresh Database** (Development only):
```bash
php artisan migrate:fresh --seed
```

2. **Clear Application Cache**:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

3. **Rebuild Frontend Assets**:
```bash
npm run build
```
Or for development:
```bash
npm run dev
```

4. **Hard Refresh Browser**:
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

## Error Handling

When a user tries to access a form without permission:
- **HTTP Status**: 403 Forbidden
- **Error Message**: "Unauthorized access to [form name]"
- **Frontend**: Should display error toast/notification

## Production Deployment

For production environments with existing data:

1. **Update CDRRMO permissions manually**:
```sql
-- Remove all permissions from CDRRMO user
DELETE FROM model_has_permissions 
WHERE model_id = (SELECT id FROM users WHERE email = 'cdrrmo@gmail.com');

-- Add only weather and communication permissions
INSERT INTO model_has_permissions (permission_id, model_type, model_id)
SELECT p.id, 'App\\Models\\User', u.id
FROM permissions p, users u
WHERE u.email = 'cdrrmo@gmail.com'
AND p.name IN ('access-weather-form', 'access-communication-form');
```

2. Deploy updated controller code
3. Clear caches
4. Test thoroughly

## Notes

- Admin users bypass all permission checks
- Frontend still filters forms based on permissions (UX layer)
- Backend now enforces permissions (Security layer)
- This implements defense in depth security principle
