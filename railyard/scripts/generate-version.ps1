param(
    [string]$ProjectRoot = ""
)

# Pre-build hook: Generate version.nsh based on wails.json productVersion
# If version contains +rc, use as-is; otherwise append .0 for 4-part version

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$wailsJsonPath = Join-Path $ProjectRoot "wails.json"
$outputPath = Join-Path $ProjectRoot "build\windows\installer\version.nsh"

# Ensure output directory exists
$outputDir = Split-Path -Parent $outputPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Read productVersion from wails.json
$wailsContent = Get-Content $wailsJsonPath -Raw | ConvertFrom-Json
$version = $wailsContent.info.productVersion

# Determine final version
if ($version -match '\+rc') {
    $finalVersion = $version.Replace('+rc', '').Replace('v', '')
} else {
    $finalVersion = "$version.0".Replace('v', '')
}

# Write version.nsh
$versionContent = "!define FINAL_VERSION `"$finalVersion`""
Set-Content -Path $outputPath -Value $versionContent -Encoding ASCII -Force

Write-Host "Generated $outputPath with FINAL_VERSION=$finalVersion"
