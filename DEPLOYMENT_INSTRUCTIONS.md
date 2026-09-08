# 🚀 Production Deployment Instructions

## ⚠️ IMPORTANT WARNING
Running `migrate:fresh --seed` will **DELETE ALL EXISTING DATA** in your production database!

## 📋 Deployment Steps

### Option A: Fresh Installation (⚠️ Deletes All Data)

**Use this if you want to start with clean demo data for visualization**

```bash
# 1. SSH into production server
ssh user@pitonmain.com

# 2. Navigate to project
cd public_html

# 3. Pull latest code
git pull origin main

# 4. Install Faker (required for seeders)
composer require fakerphp/faker --dev

# 5. BACKUP YOUR DATABASE FIRST!
# Export current database
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# 6. Run fresh migration with seeders (⚠️ DELETES ALL DATA)
php artisan migrate:fresh --seed

# 7. Clear all caches
php artisan optimize:clear
php artisan config:cache
php artisan route:cache

# 8. Restart PHP-FPM (if you have access)
sudo systemctl restart php8.2-fpm
# OR
sudo systemctl restart apache2
```

---

### Option B: Add Data to Existing Database (Keeps Current Data)

**Use this if you want to keep existing production data and add demo data**

```bash
# 1. SSH into production server
ssh user@pitonmain.com

# 2. Navigate to project
cd public_html

# 3. Pull latest code
git pull origin main

# 4. Install Faker
composer require fakerphp/faker --dev

# 5. Run ONLY the new seeders (doesn't delete existing data)
php artisan db:seed --class=YearSeeder
php artisan db:seed --class=CasualtySeeder
php artisan db:seed --class=InjuredSeeder
php artisan db:seed --class=MissingSeeder

# 6. Clear caches
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

---

## 📊 What Data Will Be Created

### Option A (Fresh Installation):
- **9 Users** with permissions (Admin, CDRRMO, IWD, ISELCO2, CEO, PNP, CSWDO, CAO, BDRRMC)
- **All Barangays** in Ilagan City
- **50 Disasters** (1 active, 49 ended) spanning 2024-2026
- **250 Weather Reports**
- **150 Water Level Reports**
- **50 Electricity Service Reports**
- **150 Water Service Reports**
- **200 Road Reports**
- **150 Bridge Reports**
- **200 Pre-emptive Evacuation Reports**
- **200 Incident Reports**
- **300 Damaged Houses Reports**
- **200 Agriculture Reports**
- **53 Deaths** (3 detailed + 50 factory-generated)
- **55 Injured** (5 detailed + 50 factory-generated)
- **52 Missing** (2 detailed + 50 factory-generated)

### Option B (Add to Existing):
- **Years 2024-2026** (if not exist)
- **50 Additional Casualties**
- **50 Additional Injured**
- **50 Additional Missing**

---

## ✅ Verification After Deployment

1. **Login to the system:**
   - URL: `https://pitonmain.com`
   - Email: `admin@gmail.com`
   - Password: `admin123`

2. **Check these pages:**
   - `/dashboard` - Should show charts with data
   - `/disasters` - Should show 50 disasters
   - `/history` - Should show historical data by year
   - All report forms should have data

3. **Verify data:**
   ```bash
   # Check disaster count
   php artisan tinker --execute="echo 'Disasters: ' . DB::table('disasters')->count();"
   
   # Check casualties
   php artisan tinker --execute="echo 'Casualties: ' . DB::table('casualties')->count();"
   
   # Check weather reports
   php artisan tinker --execute="echo 'Weather Reports: ' . DB::table('weather_reports')->count();"
   ```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

If Option A fails or you need to restore:

```bash
# Restore from backup
mysql -u username -p database_name < backup_YYYYMMDD_HHMMSS.sql

# Clear caches
php artisan optimize:clear
```

---

## 📝 Default Users After Fresh Installation

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@gmail.com | admin123 | Admin |
| CDRRMO | cdrrmo@gmail.com | wardead123 | User (All Permissions) |
| Ilagan Water District | iwd@gmail.com | wardead123 | User (Water Service) |
| ISELCO II | iselco2@gmail.com | wardead123 | User (Electricity) |
| CEO | ceo@gmail.com | wardead123 | User (Roads/Bridges) |
| PNP | pnp@gmail.com | wardead123 | User (Roads/Bridges/Incidents) |
| CSWDO | cswdo@gmail.com | wardead123 | User (Evacuations/Damaged Houses) |
| CAO | cao@gmail.com | wardead123 | User (Agriculture) |
| BDRRMC | bdrrmc@gmail.com | wardead123 | User (Multiple Forms) |

---

## 🎯 Recommended Approach

**For Production:**
- Use **Option B** if you have real production data
- Use **Option A** if this is a demo/testing environment

**For Staging/Testing:**
- Use **Option A** for clean demo data

---

## ⏱️ Estimated Time
- Option A: 5-10 minutes
- Option B: 2-3 minutes

---

## 🆘 Troubleshooting

**Error: "Class Faker\Factory not found"**
```bash
composer require fakerphp/faker --dev
```

**Error: "SQLSTATE[23000]: Integrity constraint violation"**
```bash
# Database has existing data - use Option A (fresh) or skip seeders
```

**500 Error after deployment:**
```bash
php artisan optimize:clear
php artisan config:cache
sudo systemctl restart php8.2-fpm
```

---

**🎉 Deployment Complete!**

Your system now has comprehensive data for all visualizations and reports.
