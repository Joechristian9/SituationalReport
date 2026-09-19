#!/bin/bash

# Production Deployment Script for pitonmain.com
# Run this on the production server

echo "========================================="
echo "Starting Production Deployment"
echo "========================================="

# Navigate to project directory
cd ~/domains/pitonmain.com/public_html

echo ""
echo "1. Pulling latest changes from Git..."
git pull origin main

echo ""
echo "2. Clearing all caches..."
php artisan optimize:clear

echo ""
echo "3. Caching configuration..."
php artisan config:cache

echo ""
echo "4. Caching routes..."
php artisan route:cache

echo ""
echo "5. Caching views..."
php artisan view:cache

echo ""
echo "6. Checking permissions..."
chmod -R 775 storage bootstrap/cache

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Checking Laravel logs..."
echo "Last 20 lines of laravel.log:"
tail -20 storage/logs/laravel.log 2>/dev/null || echo "No log file found or no errors yet"

echo ""
echo "Deployment finished. Please test the application."
