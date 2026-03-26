$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot

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

Push-Location (Join-Path $rootDir "frontend")
try {
    Write-Host "[frontend] running lint/format/tests/coverage..."
    Invoke-CheckedCommand { pnpm run check } "[frontend] checks failed"
}
finally {
    Pop-Location
}

Write-Host "[frontend] all checks passed"
