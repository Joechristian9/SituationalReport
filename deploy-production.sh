#!/bin/bash

# Production Deployment Script for pitonmain.com
# Run this on the production server:  bash deploy-production.sh
# SKIP_BACKUP=1 bash deploy-production.sh   skips the pre-deploy backup (emergencies only).

# Stop at the first failing step instead of carrying on with a half-deployed app.
set -euo pipefail

# Everything runs inside main(), which bash reads in full before starting. The
# `git pull` below can replace this very file, and bash reads plain scripts as it
# goes, so without this it could run a mix of the old and new versions.
main() {

cd ~/domains/pitonmain.com/public_html

echo "========================================="
echo "Starting Production Deployment"
echo "========================================="

# A restore point from just before this deploy's migrations. Runs while the site is
# still up; if it fails, nothing has changed yet and the deploy stops here.
if [ "${SKIP_BACKUP:-0}" != "1" ]; then
    echo ""
    echo "1. Backing up database and report PDFs..."
    php artisan backup:create
fi

# From here until `up`, visitors get a "back shortly" page (HTTP 503) instead of the
# errors new code would throw while vendor/ still holds the old packages. Offline
# phones treat 503 as "try later" and keep their unsent reports.
echo ""
echo "2. Entering maintenance mode..."
php artisan down --retry=60 --refresh=30

# Always leave maintenance mode, even when a step fails: a site stuck on the
# maintenance page during a disaster is worse than the error a failed step shows.
finish() {
    status=$?
    php artisan up
    if [ "$status" -ne 0 ]; then
        echo ""
        echo "!!! DEPLOYMENT FAILED (exit $status). The site is back up; check the output above"
        echo "!!! and storage/logs before retrying. Restore steps are in DEPLOY.md."
    fi
}
trap finish EXIT

echo ""
echo "3. Pulling latest changes from Git..."
git pull --ff-only origin main

echo ""
echo "4. Installing PHP dependencies (vendor/ is not in Git)..."
composer install --no-dev --optimize-autoloader --no-interaction

echo ""
echo "5. Running database migrations..."
php artisan migrate --force

echo ""
echo "6. Rebuilding caches..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "7. Checking permissions..."
chmod -R 775 storage bootstrap/cache

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Last 20 lines of today's log:"
tail -20 "storage/logs/laravel-$(date +%F).log" 2>/dev/null \
    || tail -20 storage/logs/laravel.log 2>/dev/null \
    || echo "No log file found or no errors yet"

}

main "$@"
exit
