# Kill any stale processes on the ports the app uses, then start everything.
Write-Host "`nCleaning up stale processes..." -ForegroundColor Yellow

$ports = 8080, 3000, 3001, 3002
foreach ($port in $ports) {
    $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -and $p -ne 0) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            Write-Host "  Killed PID $p on :$port" -ForegroundColor DarkGray
        }
    }
}

Write-Host "Ports cleared. Starting Pizza Maker..." -ForegroundColor Green
Write-Host ""
Write-Host "  API  -> http://localhost:8080" -ForegroundColor Cyan
Write-Host "  UI   -> http://localhost:3000" -ForegroundColor Green
Write-Host ""

npm start
