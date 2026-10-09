
# Deployment Guide for pitonmain.com

## Quick Deployment

### Step 1: Connect to Server
Open a new PowerShell/Terminal window and run:
```bash
ssh -p 65002 u988863428@156.67.222.18
```
Enter your password when prompted.

### Step 2: Run the deploy script
Once connected to the server, run:
```bash
cd /home/u988863428/domains/pitonmain.com/public_html
bash deploy-production.sh
exit
```

The script, in order:
1. Backs up the database and report PDFs (`php artisan backup:create`). If that fails it stops
   and nothing has changed. `SKIP_BACKUP=1 bash deploy-production.sh` skips it in an emergency.
2. Puts the site in maintenance mode, so visitors see a "back shortly" page instead of errors
   while new code and old `vendor/` are mixed.
3. `git pull`, `composer install` (`vendor/` is not in Git), `migrate --force`, then rebuilds the
   config, route and view caches.
4. Takes the site out of maintenance mode, also when a step failed (it then prints
   `DEPLOYMENT FAILED`).

**First deploy of this script:** the copy on the server is still the old one, so run
`git pull --ff-only origin main` once before `bash deploy-production.sh`.

After changing `.env`, run `php artisan config:cache` again, because a cached config ignores `.env`.

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
ssh -p 65002 u988863428@156.67.222.18 "cd /home/u988863428/domains/pitonmain.com/public_html && bash deploy-production.sh"
```

---

## Backups and Restore

### What is backed up
`php artisan backup:create` writes one zip to `storage/app/private/backups/` with the full
database (`database.sql`) and the stored files (`storage/`: the disaster report PDFs).
The newest 14 are kept (`BACKUP_KEEP`). It runs nightly at 01:00 and before every deploy.

### One-time setup on the server
1. **Turn on the scheduler.** hPanel → Advanced → Cron Jobs, every minute:
   ```
   cd /home/u988863428/domains/pitonmain.com/public_html && php artisan schedule:run >> /dev/null 2>&1
   ```
   Without it the nightly backup never runs. Check with `php artisan schedule:list`.
2. **Check it works once:** `php artisan backup:create`. If it says mysqldump was not found,
   set `MYSQLDUMP_PATH` in `.env` to the output of `which mysqldump`, then `php artisan config:cache`.
3. **Optional encryption:** set `BACKUP_PASSWORD` in `.env`. The dump contains names of
   casualties. Store that password outside the server, or the backups can't be opened.

### Keep a copy off the server
Backups on the server are lost with the server. At least weekly (and after each disaster
ends), download the newest zip, for example from your PC:
```bash
scp -P 65002 "u988863428@156.67.222.18:domains/pitonmain.com/public_html/storage/app/private/backups/backup-*.zip" .
```
Keep the copies private: they hold the same personal data as the app.

### Restore
1. Unzip the backup on the server:
   `cd ~ && unzip domains/pitonmain.com/public_html/storage/app/private/backups/backup-YYYY-MM-DD_HHMMSS.zip -d restore`
   (an encrypted zip asks for `BACKUP_PASSWORD`; if the server is gone, upload your off-site copy first).
2. Maintenance mode: `php artisan down`
3. Database (replaces current data):
   `mysql -u <DB_USERNAME> -p <DB_DATABASE> < ~/restore/database.sql`
   (or hPanel → Databases → phpMyAdmin → Import `database.sql`).
4. Files: `cp -r ~/restore/storage/. domains/pitonmain.com/public_html/storage/app/public/`
5. `php artisan optimize:clear && php artisan config:cache && php artisan up`

Practise a restore into a spare database once, before you need it for real.
