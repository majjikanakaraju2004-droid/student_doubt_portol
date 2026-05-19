# Configure Gmail SMTP for Synycs password-reset emails.
# Usage: .\setup-email.ps1
#    or: .\setup-email.ps1 -Gmail "you@gmail.com" -AppPassword "xxxx xxxx xxxx xxxx"

param(
    [string]$Gmail = "",
    [string]$AppPassword = ""
)

$ErrorActionPreference = "Stop"
$backendRoot = $PSScriptRoot
$envFile = Join-Path $backendRoot ".env"
$emailEnvFile = Join-Path $backendRoot "email.env"

if (-not $Gmail) {
    $Gmail = Read-Host "Gmail address (e.g. you@gmail.com)"
}
if (-not $AppPassword) {
    $secure = Read-Host "Gmail App Password (16 chars from Google App Passwords)" -AsSecureString
    $AppPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

$AppPassword = ($AppPassword -replace '\s', '').Trim()
$Gmail = $Gmail.Trim()

if (-not $Gmail -or -not $AppPassword) {
    Write-Error "Gmail address and App Password are required."
}

$emailBlock = @"
# --- Synycs SMTP (added by setup-email.ps1) ---
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=$Gmail
EMAIL_HOST_PASSWORD=$AppPassword
DEFAULT_FROM_EMAIL=$Gmail
FRONTEND_URL=http://localhost:5173
"@

Set-Content -Path $emailEnvFile -Value $emailBlock -Encoding UTF8
Write-Host "Wrote $emailEnvFile" -ForegroundColor Green

# Merge into .env (replace existing EMAIL_* lines or append)
$lines = @()
if (Test-Path $envFile) {
    $lines = Get-Content $envFile | Where-Object {
        $_ -notmatch '^\s*EMAIL_' -and $_ -notmatch '^\s*DEFAULT_FROM_EMAIL' -and $_ -notmatch '^\s*FRONTEND_URL'
    }
}
$lines += ""
$lines += $emailBlock.Split("`n")
Set-Content -Path $envFile -Value ($lines -join "`n") -Encoding UTF8
Write-Host "Updated $envFile" -ForegroundColor Green

Write-Host ""
Write-Host "Testing SMTP..." -ForegroundColor Cyan
& (Join-Path $backendRoot ".venv\Scripts\python.exe") (Join-Path $backendRoot "manage.py") send_test_email $Gmail
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Success! Check the inbox for $Gmail then restart: python manage.py runserver" -ForegroundColor Green
} else {
    Write-Host "Test failed. Verify App Password and 2-Step Verification on Google." -ForegroundColor Red
}
