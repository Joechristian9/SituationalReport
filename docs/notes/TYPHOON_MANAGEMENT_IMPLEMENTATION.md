# Typhoon Management System Implementation

## Overview
Complete typhoon management system that controls form access based on active typhoon status and auto-generates PDF reports when typhoons end.

## Database Changes

### 1. Typhoons Table
```sql
- id
- name (string) - Typhoon name e.g., "Kristine"
- description (text, nullable) - Additional details
- status (enum: active, ended) - Current status
- started_at (timestamp) - When typhoon became active
- ended_at (timestamp, nullable) - When admin ended the typhoon
- pdf_path (string, nullable) - Auto-generated PDF file path
- created_by (foreign key to users)
- ended_by (foreign key to users, nullable)
- timestamps
```

### 2. Added typhoon_id to All Report Tables
All report tables now have:
- `typhoon_id` (foreign key to typhoons, nullable)
- Cascade deletion when typhoon is deleted

**Tables Updated:**
- weather_reports
- casualties
- injureds
- missing
- pre_emptive_reports
- incident_monitored
- pre_positionings
- usc_declarations
- damaged_house_reports
- affected_tourists
- response_operations
- assistance_extendeds
- assistance_provided_lgus
- suspension_of_classes
- suspension_of_works
- bridges
- roads
- water_levels
- communications
- electricities
- water_sources

## Backend Implementation

### Models

#### **Typhoon Model** (`app/Models/Typhoon.php`)
**Relationships:**
- `creator()` - User who created the typhoon report
- `ender()` - User who ended the typhoon report
- Relationships to all 22 report tables

**Scopes:**
- `active()` - Get only active typhoons
- `ended()` - Get ended typhoons

**Static Methods:**
- `getActiveTyphoon()` - Get the currently active typhoon
- `hasActiveTyphoon()` - Check if there's an active typhoon

### Controllers

#### **TyphoonController** (`app/Http/Controllers/TyphoonController.php`)
**Admin Routes:**
- `GET /typhoons` - Typhoon management page (index)
- `POST /typhoons` - Create new typhoon report (store)
- `PATCH /typhoons/{typhoon}` - Update typhoon details (update)
- `POST /typhoons/{typhoon}/end` - End typhoon & generate PDF (end)
- `DELETE /typhoons/{typhoon}` - Delete ended typhoon (destroy)
- `GET /typhoons/{typhoon}/download` - Download PDF report (downloadPdf)

**Public Routes:**
- `GET /api/typhoon/active` - Get active typhoon info (getActiveTyphoon)

**Key Features:**
- Only one active typhoon at a time
- Automatic PDF generation when ending typhoon
- Prevents deletion of active typhoons
- Tracks who created and ended each typhoon

#### **ReportController** (Updated)
**Method Updated:** `getReportData()`
- Now supports both `year` and `typhoonId` filtering
- When `typhoonId` is provided, filters all data by that typhoon
- When `year` is provided, filters by creation year (legacy support)

### Middleware

#### **CheckTyphoonStatus** (`app/Http/Middleware/CheckTyphoonStatus.php`)
**Purpose:** Block form access when no active typhoon exists

**Behavior:**
- Admins can bypass (always have access)
- Regular users blocked if no active typhoon
- Returns JSON error for API requests
- Redirects to dashboard for web requests

**Registration:** `bootstrap/app.php`
```php
'typhoon.active' => \App\Http\Middleware\CheckTyphoonStatus::class
```

#### **HandleInertiaRequests** (Updated)
**Shares typhoon data globally:**
```php
'typhoon' => [
    'active' => Typhoon::getActiveTyphoon(),
    'hasActive' => Typhoon::hasActiveTyphoon(),
]
```

### Routes

#### **Protected Form Routes**
All form routes wrapped in `typhoon.active` middleware:
```php
Route::middleware(['auth', 'role:user|admin'])->group(function () {
    Route::middleware(['typhoon.active'])->group(function () {
        // All form routes (Situation Overview, Pre-Emptive, etc.)
    });
});
```

#### **Admin Routes**
```php
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::prefix('typhoons')->group(function () {
        // Typhoon management routes
    });
});
```

## Frontend Implementation

### Admin Pages

#### **TyphoonManagement.jsx** (`resources/js/Pages/Admin/TyphoonManagement.jsx`)
**Features:**
- Create new typhoon reports
- View active typhoon with highlighted card
- End active typhoon (generates PDF)
- View typhoon history
- Download PDF reports for ended typhoons
- Delete ended typhoons
- Informational guide for admins

**UI Components Used:**
- Card, Button, Badge, Dialog
- Forms with Input, Textarea, Label
- Icons from Lucide React
- Toast notifications

### User Components

#### **TyphoonStatusBanner.jsx** (`resources/js/Components/TyphoonStatusBanner.jsx`)
**Purpose:** Show typhoon status to users

**Display States:**
1. **No Active Typhoon:** Gray banner - forms disabled
2. **Active Typhoon:** Blue banner - shows typhoon name, description, start date

**Usage:** Add to any page where users need typhoon status awareness

### Navigation

#### **Updated Sidebar** (`resources/js/Components/app-sidebar.jsx`)
Added "Typhoon Management" menu item:
- Admin-only visibility
- Cloud icon
- Appears after Dashboard, before Situation Overview

## User Workflows

### Admin Workflow

#### **Creating New Typhoon Report:**
1. Admin clicks "Create New Typhoon Report"
2. Enters typhoon name (required) and description (optional)
3. Submits form
4. System creates typhoon with status "active"
5. All forms become accessible to users
6. Users can now input data

#### **Ending Typhoon Report:**
1. Admin clicks "End This Typhoon Report" on active typhoon
2. Confirms action in modal
3. System:
   - Changes status to "ended"
   - Records end timestamp and who ended it
   - Automatically generates PDF report
   - Stores PDF path in database
   - Disables all forms for users
4. PDF becomes downloadable from history

### User Workflow

#### **With Active Typhoon:**
- Dashboard shows blue banner with typhoon name
- All form pages accessible
- Data automatically tagged with typhoon_id
- Can view their submissions

#### **Without Active Typhoon:**
- Dashboard shows gray "No Active Typhoon" banner
- Form pages redirect to dashboard with error
- API calls return 403 error
- Cannot submit any data

## Data Association

### Automatic Typhoon Assignment

**All form controllers must be updated to:**
1. Get active typhoon on data submission
2. Associate data with active typhoon_id

**Example Pattern:**
```php
public function store(Request $request)
{
    $activeTyphoon = Typhoon::getActiveTyphoon();
    
    if (!$activeTyphoon) {
        return response()->json([
            'message' => 'No active typhoon. Cannot save data.'
        ], 403);
    }
    
    $data = $request->validate([...]);
    $data['typhoon_id'] = $activeTyphoon->id;
    
    Model::create($data);
    // ...
}
```

## PDF Report Generation

### Automatic Process
When admin ends a typhoon:
1. System calls `TyphoonController@end`
2. Updates typhoon status to "ended"
3. Calls `ReportController->getReportData($typhoonId)`
4. Generates PDF using existing report blade template
5. Saves PDF to `storage/app/public/reports/`
6. Filename format: `Typhoon_[Name]_Report_[DateTime].pdf`
7. Updates typhoon record with PDF path

### PDF Settings
- Paper: Legal, Portrait
- DPI: 96 (optimized)
- Uses existing `reports.situational_report` blade template
- All data filtered by typhoon_id

## Migration Guide

### To Run Migrations:
```bash
php artisan migrate
```

This will:
1. Create `typhoons` table
2. Add `typhoon_id` column to all 22 report tables

### Important Notes:
- Existing data will have `typhoon_id = NULL`
- Old data remains accessible via year filtering
- New data requires active typhoon

## Form Controller Updates Needed

Each form controller storing data must be updated to:

### 1. Import Typhoon Model
```php
use App\Models\Typhoon;
```

### 2. Check for Active Typhoon
```php
$activeTyphoon = Typhoon::getActiveTyphoon();
if (!$activeTyphoon) {
    return response()->json(['message' => 'No active typhoon'], 403);
}
```

### 3. Associate Data
```php
$data['typhoon_id'] = $activeTyphoon->id;
```

### Controllers to Update:
- SituationOverviewController (7 methods)
- PreEmptiveReportController
- UscDeclarationController
- PrePositioningController
- IncidentMonitoredController
- CasualtyController
- InjuredController
- MissingController
- AffectedTouristController
- DamagedHouseReportController
- AssistanceExtendedController
- AssistanceProvidedLguController
- SuspensionOfClassController
- SuspensionOfWorkController
- ResponseOperationController

## Testing Checklist

### Admin Tests:
- ✅ Create new typhoon report
- ✅ Update typhoon details
- ✅ End active typhoon
- ✅ Verify PDF generated
- ✅ Download PDF
- ✅ Delete ended typhoon
- ✅ Prevent creating multiple active typhoons

### User Tests:
- ✅ See "No Active Typhoon" when none exists
- ✅ Forms blocked when no active typhoon
- ✅ See active typhoon banner
- ✅ Submit data when typhoon active
- ✅ Data tagged with correct typhoon_id
- ✅ Forms blocked after typhoon ends

### Data Integrity Tests:
- ✅ Cascade deletion works
- ✅ Old data (NULL typhoon_id) still accessible
- ✅ PDF contains correct typhoon data
- ✅ Reports filter by typhoon correctly

## Security Considerations

1. **Middleware Protection:** All form routes protected
2. **Admin-Only Actions:** Create, end, delete typhoons
3. **Role Checks:** Admin bypass middleware
4. **Validation:** Required fields enforced
5. **Cascade Deletion:** Orphaned data cleaned up

## Performance Optimizations

1. **Query Limits:** 100 records for PDF, 500 for web
2. **Eager Loading:** Relations loaded efficiently
3. **Cached Permissions:** Spatie permission caching
4. **Lazy Shared Props:** Typhoon data lazy-loaded
5. **Optimized PDF:** Lower DPI, simpler fonts

## Future Enhancements

### Potential Features:
1. **Typhoon Templates:** Pre-fill description from templates
2. **Multiple Active Typhoons:** Support regional separation
3. **Scheduled Ending:** Auto-end typhoons after X days
4. **Email Notifications:** Alert users when typhoon starts/ends
5. **Export Options:** Excel, CSV exports per typhoon
6. **Comparison Reports:** Compare data across typhoons
7. **Archive System:** Long-term storage for old typhoons
8. **Backup PDFs:** Cloud storage integration

## Troubleshooting

### Common Issues:

**Issue:** Forms still accessible without active typhoon
**Solution:** Check middleware applied to routes, clear route cache

**Issue:** PDF generation fails
**Solution:** Check storage permissions, verify DomPDF installed

**Issue:** Data not associated with typhoon
**Solution:** Update form controllers to assign typhoon_id

**Issue:** Middleware blocking admins
**Solution:** Verify role check in CheckTyphoonStatus middleware

## File Locations

### Backend:
- Migrations: `database/migrations/2025_11_08_*.php`
- Models: `app/Models/Typhoon.php`
- Controllers: `app/Http/Controllers/TyphoonController.php`
- Middleware: `app/Http/Middleware/CheckTyphoonStatus.php`
- Middleware Registration: `bootstrap/app.php`
- Routes: `routes/web.php`

### Frontend:
- Admin Page: `resources/js/Pages/Admin/TyphoonManagement.jsx`
- User Banner: `resources/js/Components/TyphoonStatusBanner.jsx`
- Sidebar: `resources/js/Components/app-sidebar.jsx`

### Documentation:
- This file: `TYPHOON_MANAGEMENT_IMPLEMENTATION.md`
