# Deployment Script for pitonmain.com
# This script uploads the built assets to production

$ServerHost = "156.67.222.18"
$ServerPort = "65002"
$ServerUser = "u988863428"
$RemotePath = "/home/u988863428/domains/pitonmain.com/public_html/"
$LocalBuildPath = "public/build"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deploying to pitonmain.com" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if build directory exists
if (!(Test-Path $LocalBuildPath)) {
    Write-Host "Error: Build directory not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

Write-Host "Files to upload:" -ForegroundColor Yellow
Get-ChildItem "$LocalBuildPath/assets" -Filter "BatchHistory*" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Green
}
Write-Host "  - manifest.json" -ForegroundColor Green
Write-Host ""

Write-Host "Upload command (manual):" -ForegroundColor Yellow
Write-Host "scp -P $ServerPort -r $LocalBuildPath/* ${ServerUser}@${ServerHost}:${RemotePath}public/build/" -ForegroundColor White
Write-Host ""
Write-Host "Or use an FTP client like FileZilla:" -ForegroundColor Yellow
Write-Host "  Host: $ServerHost" -ForegroundColor White
Write-Host "  Port: $ServerPort" -ForegroundColor White
Write-Host "  User: $ServerUser" -ForegroundColor White
Write-Host "  Remote path: $RemotePath" -ForegroundColor White
Write-Host ""
Write-Host "After upload, clear browser cache or hard refresh (Ctrl+Shift+R)" -ForegroundColor Cyan
