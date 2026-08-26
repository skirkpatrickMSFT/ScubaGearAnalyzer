<#
.SYNOPSIS
    Packages the ScubaGear Analyzer into a clean distributable zip file.

.DESCRIPTION
    Creates a release zip containing only the files needed for any organization
    to deploy the solution. Excludes secrets, build artifacts, node_modules,
    and development-only files.

.PARAMETER OutputPath
    Path for the output zip. Default: .\release\ScubaGearAnalyzer.zip

.EXAMPLE
    .\package.ps1
    .\package.ps1 -OutputPath C:\releases\ScubaGearAnalyzer-v1.0.zip
#>

[CmdletBinding()]
param(
    [string]$OutputPath = ".\release\ScubaGearAnalyzer.zip"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }

$root = $PSScriptRoot

# ── Pre-flight checks ──────────────────────────────────────
Write-Step "Pre-flight checks"

# Verify no real secrets remain in tracked files
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "sk-proj-|sk-[a-zA-Z0-9]{20,}") {
        throw "ABORT: .env contains a real API key. Replace it with a placeholder before packaging."
    }
}

$openApiFile = Join-Path $root "azure-functions\openapi.json"
if (Test-Path $openApiFile) {
    $openApiContent = Get-Content $openApiFile -Raw
    if ($openApiContent -match "scubagear-func-[a-z0-9]+\.azurewebsites\.net") {
        throw "ABORT: openapi.json contains a deployed Azure hostname. Replace with '<your-function-app>.azurewebsites.net'."
    }
}

Write-OK "No secrets detected in distributable files"

# ── Define what to include ─────────────────────────────────
Write-Step "Building file manifest"

$includeItems = @(
    # Root files
    "README.md"
    "DEPLOYMENT-GUIDE.md"
    "POWER-PLATFORM-DEPLOY.md"
    "deploy-functions.ps1"
    "update-functions.ps1"
    "teardown.ps1"
    "package.ps1"
    ".gitignore"
    ".env"
    ".env.example"
    "test-subset.json"

    # Azure Functions (source only — consumers will npm install + build)
    "azure-functions\host.json"
    "azure-functions\local.settings.json"
    "azure-functions\openapi.json"
    "azure-functions\package.json"
    "azure-functions\package-lock.json"
    "azure-functions\tsconfig.json"
    "azure-functions\scubagear-version.json"
    "azure-functions\src"
    "azure-functions\scripts"
    "azure-functions\test"

    # Infrastructure
    "infra"

    # Power Apps
    "power-apps\README.md"
    "power-apps\build-app.ps1"
    "power-apps\canvas-src"
    "power-apps\_inspect"

    # Copilot Studio
    "copilot-studio"
)

# ── Create staging directory ───────────────────────────────
Write-Step "Creating staging directory"

$staging = Join-Path $root "release\staging\ScubaGearAnalyzer"
if (Test-Path $staging) {
    Remove-Item $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging -Force | Out-Null

foreach ($item in $includeItems) {
    $source = Join-Path $root $item
    if (-not (Test-Path $source)) {
        Write-Warn "Skipped (not found): $item"
        continue
    }

    $dest = Join-Path $staging $item
    $destParent = Split-Path $dest -Parent
    if (-not (Test-Path $destParent)) {
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }

    if ((Get-Item $source).PSIsContainer) {
        Copy-Item $source $dest -Recurse -Force
    } else {
        Copy-Item $source $dest -Force
    }
}

Write-OK "Staged $($includeItems.Count) items"

# ── Create the .env.example at root if missing ─────────────
$envExample = Join-Path $staging ".env.example"
if (-not (Test-Path $envExample)) {
    @"
# ScubaGear Analyzer — Environment Variables
# Copy this file to .env and fill in your values.

OPENAI_API_KEY=<your-openai-api-key>
"@ | Set-Content $envExample -Encoding UTF8
    Write-OK "Created root .env.example"
}

# ── Final scan of staging for leaked secrets ───────────────
Write-Step "Final security scan of staged files"

# Build patterns dynamically to avoid them appearing literally in this script
$keyPattern = "sk-proj-|sk-[a-zA-Z0-9]{20,}"
$hostPattern = "scubagear-func-[a-z0-9]+\.azurewebsites\.net"
$leakPattern = $keyPattern + "|" + $hostPattern

# Exclude this script itself from the scan (it contains pattern strings, not secrets)
$leaks = Get-ChildItem $staging -Recurse -File |
    Where-Object { $_.Name -ne "package.ps1" } |
    ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and ($content -match $leakPattern)) {
            $_.FullName.Replace($staging, "")
        }
    }

if ($leaks) {
    Write-Host ""
    Write-Host "  LEAKED SECRETS FOUND IN:" -ForegroundColor Red
    $leaks | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    throw "ABORT: Secrets detected in staged files. Clean them before packaging."
}

Write-OK "No secrets or personal data detected"

# ── Create zip ─────────────────────────────────────────────
Write-Step "Creating zip archive"

$outputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Force
}

$stagingParent = Split-Path $staging -Parent
Compress-Archive -Path $staging -DestinationPath $OutputPath -CompressionLevel Optimal

Write-OK "Created: $OutputPath"

# ── Cleanup staging ────────────────────────────────────────
Remove-Item (Join-Path $root "release\staging") -Recurse -Force

# ── Summary ────────────────────────────────────────────────
$zipSize = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ScubaGear Analyzer — Package Complete" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Output  : $OutputPath" -ForegroundColor White
Write-Host "  Size    : $zipSize MB" -ForegroundColor White
Write-Host ""
Write-Host "  Contents:" -ForegroundColor Yellow
Write-Host "    azure-functions/     — Azure Functions backend (TypeScript source)" -ForegroundColor White
Write-Host "    infra/               — Bicep infrastructure template (functions.bicep)" -ForegroundColor White
Write-Host "    power-apps/          — Power Apps canvas app guide + source" -ForegroundColor White
Write-Host "    copilot-studio/      — Copilot Studio agent definition" -ForegroundColor White
Write-Host "    deploy-functions.ps1 — One-click Azure Functions deployment" -ForegroundColor White
Write-Host "    test-subset.json     — Sample test data" -ForegroundColor White
Write-Host ""
Write-Host "  Deployment:" -ForegroundColor Yellow
Write-Host "    1. Unzip to a folder" -ForegroundColor White
Write-Host "    2. Copy .env.example to .env, add your OpenAI key" -ForegroundColor White
Write-Host "    3. Run: .\deploy-functions.ps1 -ResourceGroupName <rg-name>" -ForegroundColor White
Write-Host "    4. Follow POWER-PLATFORM-DEPLOY.md for Power Apps setup" -ForegroundColor White
Write-Host "    5. Follow power-apps/README.md to build the canvas app" -ForegroundColor White
Write-Host ""
