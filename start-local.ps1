param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ensure-NpmInstall([string]$cwd, [string[]]$args) {
  $nodeModulesPath = Join-Path $cwd "node_modules"
  if (-not (Test-Path $nodeModulesPath)) {
    Push-Location $cwd
    try {
      & npm @args
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } finally {
      Pop-Location
    }
  }
}

Ensure-NpmInstall $root @("install")
Ensure-NpmInstall (Join-Path $root "frontend") @("install")

$backendCommand = "Set-Location -LiteralPath '$root'; npm run dev:server"
$frontendCommand = "Set-Location -LiteralPath '$root'; npm run dev:frontend"

if ($DryRun) {
  Write-Host $backendCommand
  Write-Host $frontendCommand
  exit 0
}

Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $backendCommand) -WorkingDirectory $root | Out-Null
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $frontendCommand) -WorkingDirectory $root | Out-Null

Write-Host "已启动：后端 http://localhost:3000 ；前端 http://localhost:5173"
