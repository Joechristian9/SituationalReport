# SSH Deployment Script for pitonmain.com
# This script connects to the server and pulls the latest changes

$ServerHost = "156.67.222.18"
$ServerPort = "65002"
$ServerUser = "u988863428"
$RemotePath = "/home/u988863428/domains/pitonmain.com/public_html"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "SSH DEPLOYMENT TO PRODUCTION" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $ServerHost" -ForegroundColor Yellow
Write-Host "Port: $ServerPort" -ForegroundColor Yellow
Write-Host "User: $ServerUser" -ForegroundColor Yellow
Write-Host ""
Write-Host "Commands to run on server:" -ForegroundColor Green
Write-Host "1. cd $RemotePath" -ForegroundColor White
Write-Host "2. git pull origin main" -ForegroundColor White
Write-Host "3. php artisan cache:clear" -ForegroundColor White
Write-Host "4. php artisan view:clear" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to connect to server..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Connect to server with interactive shell
ssh -p $ServerPort ${ServerUser}@${ServerHost}
