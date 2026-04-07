$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

$distDir = Join-Path $rootDir "frontend/dist"
$placeholderFile = Join-Path $distDir ".embed-placeholder"
New-Item -ItemType Directory -Path $distDir -Force | Out-Null
if (-not (Test-Path $placeholderFile)) {
    Set-Content -Path $placeholderFile -Value "placeholder"
}

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

Write-Host "[backend] checking Go formatting..."
$goFiles = git ls-files "*.go"
if ($goFiles) {
    $unformatted = gofmt -l $goFiles
    if ($unformatted) {
        Write-Host "[backend] gofmt required for:"
        $unformatted | ForEach-Object { Write-Host $_ }
        throw "[backend] gofmt check failed"
    }
}

Write-Host "[backend] running Go tests..."
Invoke-CheckedCommand { go test ./... } "[backend] Go tests failed"

Write-Host "[backend] running Go coverage gate..."
Invoke-CheckedCommand { & (Join-Path $rootDir "scripts/check-go-coverage.ps1") } "[backend] Go coverage gate failed"

Write-Host "[backend] running Python formatting check..."
Set-Location (Join-Path $rootDir "locomotive")
Invoke-CheckedCommand { poetry run black --line-length=120 --check . } "[backend] Python formatting check failed (black)"
Invoke-CheckedCommand { poetry run isort --check . } "[backend] Python formatting check failed (isort)"
Set-Location $rootDir

Write-Host "[backend] all checks passed"
