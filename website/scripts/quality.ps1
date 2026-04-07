$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
Push-Location $rootDir

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

try {
    Write-Host "running lint/format..."
    Invoke-CheckedCommand { pnpm run check } "checks failed"
}
finally {
    Pop-Location
}

Write-Host "all checks passed"
