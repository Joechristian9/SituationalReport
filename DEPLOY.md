
# Deployment Guide for pitonmain.com

## Quick Deployment

### Step 1: Connect to Server
Open a new PowerShell/Terminal window and run:
```bash
ssh -p 65002 u988863428@156.67.222.18
```
Enter your password when prompted.

### Step 2: Pull Latest Changes
Once connected to the server, run these commands:
```bash
cd /home/u988863428/domains/pitonmain.com/public_html
git pull origin main
php artisan cache:clear
php artisan view:clear
exit
```

### Step 3: Clear Browser Cache
- Visit: https://pitonmain.com/history
- Press: **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac)

---
## What Was Deployed

### Latest Commit: `e9ee259`
**Message:** "refactor: Remove cards and enhance Batch History UI with top filters and icon-based design"

### Changes:
✅ Removed card-based layout from Batch History page
✅ Moved filter options to top of page with cleaner horizontal layout
✅ Enhanced UI with icon-based design (FileText icon in colored badge)
✅ Simplified Year and Form Type selection into single row
✅ Improved visual hierarchy and spacing
✅ Maintained all existing functionality (Add Year, disaster display, pagination)
✅ Better responsive layout for mobile and desktop
✅ Cleaner empty state design without cards

### Previous Commit: `331e1c0`
**Message:** "feat: Refactor year system from academic ranges to individual calendar years with dynamic year management"

### Previous Changes:
✅ Changed from academic year ranges (2025-26) to individual calendar years (2025, 2026, 2027)
✅ Created `years` table with `year` (integer) column
✅ Added `year_id` foreign key to disasters table
✅ Created YearController with index/store/destroy methods
✅ Updated HistoryController to use years table
✅ Created YearSeeder to populate years from existing disasters
✅ Added "Add Year" button with modal for creating new years
✅ All data now properly scoped to selected year
✅ Validation: years between 1900-2100
✅ Dynamic year management with instant availability

### Files Modified:
- `resources/js/Pages/Admin/BatchHistory.jsx` - Refactored UI layout
- `database/migrations/2026_09_07_101301_create_years_table.php` - New years table
- `database/migrations/2026_09_07_101410_add_year_id_to_typhoons_table.php` - Added year_id FK
- `app/Models/Year.php` - New Year model
- `app/Models/Typhoon.php` - Added year relationship
- `app/Http/Controllers/YearController.php` - Year CRUD operations
- `app/Http/Controllers/HistoryController.php` - Refactored for years table
- `database/seeders/YearSeeder.php` - Data migration seeder
- `routes/web.php` - Added year routes
- Multiple compiled assets in `public/build/`undle
- `public/build/manifest.json` - Asset manifest

---

## Troubleshooting

### If changes don't appear:
1. Hard refresh browser: **Ctrl + Shift + R**
2. Clear Laravel cache on server:
   ```bash
   ssh -p 65002 u988863428@156.67.222.18
   cd /home/u988863428/domains/pitonmain.com/public_html
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   ```
3. Check if git pull was successful (should show files updated)
4. Verify manifest.json was updated (check timestamp)

### Check deployment status:
```bash
ssh -p 65002 u988863428@156.67.222.18
cd /home/u988863428/domains/pitonmain.com/public_html
git log -1 --oneline
# Should show: e9ee259 refactor: Remove cards and enhance Batch History UI with top filters and icon-based design
```

---

## Alternative: One-Line Deployment
Copy and paste this entire command (requires password):
```bash
ssh -p 65002 u988863428@156.67.222.18 "cd /home/u988863428/domains/pitonmain.com/public_html && git pull origin main && php artisan cache:clear && php artisan view:clear && echo 'Deployment complete!'"
```
