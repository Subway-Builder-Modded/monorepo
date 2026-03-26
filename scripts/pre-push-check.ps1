$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

function Invoke-CheckedCommand {
    param(
        [scriptblock]$Command,
        [string]$FailureMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)"
    }
}

Write-Host "[pre-push] applying Go formatting..."
$goFiles = git ls-files "*.go"
if ($goFiles) {
    Invoke-CheckedCommand { gofmt -w $goFiles } "[pre-push] gofmt apply failed"

    $remainingUnformatted = gofmt -l $goFiles
    if ($remainingUnformatted) {
        Write-Host "[pre-push] gofmt still required for:"
        $remainingUnformatted | ForEach-Object { Write-Host $_ }
        throw "[pre-push] gofmt post-apply check failed"
    }
}

Write-Host "[pre-push] running backend quality checks..."
Invoke-CheckedCommand { & (Join-Path $rootDir "scripts/backend-quality.ps1") } "[pre-push] backend quality checks failed"

Write-Host "[pre-push] applying frontend formatting/lint fixes..."
Push-Location (Join-Path $rootDir "frontend")
try {
    Invoke-CheckedCommand { pnpm run format } "[pre-push] frontend format apply failed"
    Invoke-CheckedCommand { pnpm run lint:fix } "[pre-push] frontend lint:fix failed"
}
finally {
    Pop-Location
}

Write-Host "[pre-push] running frontend quality checks..."
Invoke-CheckedCommand { & (Join-Path $rootDir "scripts/frontend-quality.ps1") } "[pre-push] frontend quality checks failed"

Write-Host "[pre-push] all checks passed"
