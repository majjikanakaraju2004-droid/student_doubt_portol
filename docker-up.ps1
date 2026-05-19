# Cleanly spin up the Synycs Docker cluster

Write-Host "==> Spinning down any active containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

Write-Host "==> Rebuilding and booting Synycs Application Cluster..." -ForegroundColor Green
docker-compose up --build -d

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Synycs Cluster successfully started!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  - Backend API: http://localhost:8000/api/" -ForegroundColor Green
Write-Host "  - Database Port: 3307" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
