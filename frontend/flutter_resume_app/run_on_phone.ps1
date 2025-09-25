# Helper script to run Flutter app on physical Android device
# Automatically detects PC IP and runs with correct BASE_URL

Write-Host "Detecting PC IP address..." -ForegroundColor Green

# Get the active Wi-Fi adapter IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue).IPAddress

if (-not $ip) {
    # Fallback: try to get any active network adapter IP (excluding loopback)
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress
}

if (-not $ip) {
    Write-Host "Could not detect IP address. Please run manually with:" -ForegroundColor Red
    Write-Host "flutter run -d `"Pixel 7 Pro`" --dart-define=BASE_URL=http://YOUR_IP:3000" -ForegroundColor Yellow
    exit 1
}

Write-Host "Detected IP: $ip" -ForegroundColor Cyan
Write-Host "Testing server connectivity..." -ForegroundColor Green

# Test if server is reachable
try {
    $response = Invoke-WebRequest -Uri "http://${ip}:3000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Server is reachable" -ForegroundColor Green
} catch {
    Write-Host "✗ Server not reachable at http://${ip}:3000" -ForegroundColor Red
    Write-Host "Make sure your Node server is running with: node app.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running Flutter app on Pixel 7 Pro..." -ForegroundColor Green
Write-Host "BASE_URL=http://${ip}:3000" -ForegroundColor Cyan

flutter run -d "Pixel 7 Pro" --dart-define=BASE_URL=http://${ip}:3000
