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

### Latest Commit: `7a3f9a6`
**Message:** "Build: Compile pagination changes for FormSubmissionStatus page"

### Changes:
✅ Unified pagination UI between Disaster Management and Form Submission Status pages
✅ Added rows per page dropdown (10, 25, 50, 100 options)
✅ Implemented smart pagination with ellipsis (...) for large page counts
✅ Added memoized pagination calculations for better performance
✅ Auto-reset to page 1 when filtering or changing rows per page
✅ Consistent styling and layout across admin pages

### Files Modified:
- `resources/js/Pages/Admin/FormSubmissionStatus.jsx` - Main component with unified pagination
- `public/build/assets/FormSubmissionStatus-D1BWJFQH.js` - Compiled JavaScript
- `public/build/assets/app-CANrFMjn.js` - App bundle
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
# Should show: 7a3f9a6 Build: Compile pagination changes for FormSubmissionStatus page
```

---

## Alternative: One-Line Deployment
Copy and paste this entire command (requires password):
```bash
ssh -p 65002 u988863428@156.67.222.18 "cd /home/u988863428/domains/pitonmain.com/public_html && git pull origin main && php artisan cache:clear && php artisan view:clear && echo 'Deployment complete!'"
```
