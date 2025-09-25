# Quick test script to verify API connectivity from phone's perspective

Write-Host "Testing Resume Scanner API connectivity..." -ForegroundColor Green

# Get PC IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue).IPAddress
if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress
}

Write-Host "PC IP: $ip" -ForegroundColor Cyan

# Test health endpoint
Write-Host "`nTesting health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://$ip`:3000/health" -TimeoutSec 5
    Write-Host "✓ Health check passed: $($health | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure Node server is running: node app.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📱 For your phone to connect, use this URL in Flutter:" -ForegroundColor Magenta
Write-Host "   http://${ip}:3000" -ForegroundColor White

Write-Host "`n🚀 Run Flutter with:" -ForegroundColor Magenta  
Write-Host "   flutter run -d `"Pixel 7 Pro`" --dart-define=BASE_URL=http://${ip}:3000" -ForegroundColor White

Write-Host "`n✅ API is ready for mobile connections!" -ForegroundColor Green
