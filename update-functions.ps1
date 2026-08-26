<#
.SYNOPSIS
    Redeploys the ScubaGear Analyzer function code to an existing Function App.

.DESCRIPTION
    Code-only update path - does not touch Bicep/infrastructure or prompt for secrets.
    Use this after regenerating baselines or changing function code.

      1. Regenerates/validates baseline data against the pinned ScubaGear tag
      2. Builds and tests the TypeScript project
      3. Publishes the code to the existing Function App
      4. Smoke-tests the endpoints
      5. Writes a connector-ready openapi.json with the live host filled in

.PARAMETER ResourceGroupName
    Resource group containing the Function App.

.PARAMETER FunctionAppName
    Target Function App. Auto-discovered when a single app exists in the resource group.

.PARAMETER UpdateBaselines
    Regenerate baseline data from the latest ScubaGear release before building.

.PARAMETER Tag
    ScubaGear tag to pin when used with -UpdateBaselines. Defaults to the latest release.

.PARAMETER SkipTests
    Skip the test suite (not recommended).

.EXAMPLE
    .\update-functions.ps1 -ResourceGroupName rg-scubagear-functions

.EXAMPLE
    .\update-functions.ps1 -ResourceGroupName rg-scubagear-functions -UpdateBaselines
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [string]$FunctionAppName = "",
    [switch]$UpdateBaselines,
    [string]$Tag = "",
    [switch]$SkipTests
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "`n> $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "  [ok] $msg" -ForegroundColor Green }
function Write-Info([string]$msg) { Write-Host "  [--] $msg" -ForegroundColor Yellow }
function Write-Bad([string]$msg)  { Write-Host "  [!!] $msg" -ForegroundColor Red }

$root = $PSScriptRoot

# --- Prerequisites -----------------------------------------
Write-Step "Checking prerequisites"

foreach ($tool in @("az", "func", "node")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "'$tool' not found on PATH. If Node was just installed, restart your shell."
    }
}
Write-OK "az, func and node available (node $(node --version))"

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Info "Not logged in. Running 'az login'..."
    az login | Out-Null
    $account = az account show | ConvertFrom-Json
}
Write-OK "Subscription: $($account.name)"

# --- Resolve the Function App ------------------------------
Write-Step "Resolving Function App"

if ([string]::IsNullOrWhiteSpace($FunctionAppName)) {
    $apps = @(az functionapp list --resource-group $ResourceGroupName --query "[].name" -o tsv)
    if ($apps.Count -eq 0) {
        throw "No Function Apps found in resource group '$ResourceGroupName'."
    }
    if ($apps.Count -gt 1) {
        throw "Multiple Function Apps found ($($apps -join ', ')). Pass -FunctionAppName."
    }
    $FunctionAppName = $apps[0]
}
$funcUrl = "https://$FunctionAppName.azurewebsites.net"
Write-OK "Target: $FunctionAppName"

Push-Location (Join-Path $root "azure-functions")
try {
    # --- Baselines -----------------------------------------
    Write-Step "Preparing baseline data"

    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing dependencies..."
        npm install --no-audit --no-fund | Out-Null
    }

    if ($UpdateBaselines) {
        if ([string]::IsNullOrWhiteSpace($Tag)) {
            npm run baselines:generate
        } else {
            npm run baselines:generate -- --tag $Tag
        }
        if ($LASTEXITCODE -ne 0) { throw "Baseline generation failed." }
        Write-Info "Baseline data regenerated - commit the changes after this run."
    }

    $pinned = Get-Content "scubagear-version.json" -Raw | ConvertFrom-Json
    Write-OK "Baselines: ScubaGear $($pinned.tag), $($pinned.controlCount) controls"

    # --- Build and test ------------------------------------
    Write-Step "Building"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed." }
    Write-OK "Build complete"

    if (-not $SkipTests) {
        Write-Step "Running tests"
        npm test
        if ($LASTEXITCODE -ne 0) { throw "Tests failed - deployment aborted." }
        Write-OK "Tests passed"
    }

    # --- Publish -------------------------------------------
    Write-Step "Publishing code to $FunctionAppName"
    func azure functionapp publish $FunctionAppName --javascript
    if ($LASTEXITCODE -ne 0) { throw "Publish failed." }
    Write-OK "Code deployed"
}
finally {
    Pop-Location
}

# --- Smoke tests -------------------------------------------
Write-Step "Smoke-testing endpoints"

$hostKey = az functionapp keys list `
    --resource-group $ResourceGroupName `
    --name $FunctionAppName `
    --query "functionKeys.default" -o tsv

$checks = @(
    @{ Name = "List controls";       Path = "/api/baseline/controls?code=$hostKey" },
    @{ Name = "Control lookup";      Path = "/api/baseline/control?controlId=MS.AAD.1.1v1&code=$hostKey" },
    @{ Name = "Per-product section"; Path = "/api/baseline/section?number=17&product=EXO&code=$hostKey" }
)

$failed = 0
foreach ($check in $checks) {
    try {
        # Cold start on Flex Consumption can take a while on the first call.
        $resp = Invoke-RestMethod -Uri "$funcUrl$($check.Path)" -Method Get -TimeoutSec 120
        $props = $resp.PSObject.Properties.Name
        $detail = ""
        if ($props -contains 'count') {
            $detail = " ($($resp.count) items)"
        } elseif ($props -contains 'totalControls') {
            $detail = " ($($resp.totalControls) controls)"
        }
        Write-OK "$($check.Name)$detail"
    }
    catch {
        Write-Bad "$($check.Name): $($_.Exception.Message)"
        $failed++
    }
}

if ($failed -gt 0) {
    Write-Bad "$failed smoke test(s) failed. Check logs: func azure functionapp logstream $FunctionAppName"
}

# --- Connector-ready spec ----------------------------------
Write-Step "Generating connector spec"

$specSource = Join-Path $root "azure-functions\openapi.json"
$outDir = Join-Path $root "release"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$specOut = Join-Path $outDir "openapi.$FunctionAppName.json"
$spec = Get-Content $specSource -Raw | ConvertFrom-Json
$spec.host = "$FunctionAppName.azurewebsites.net"
$spec | ConvertTo-Json -Depth 100 | Set-Content $specOut -Encoding UTF8

Write-OK "Wrote $([System.IO.Path]::GetFileName($specOut))"

# --- Summary -----------------------------------------------
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Update complete - $FunctionAppName" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL       : $funcUrl" -ForegroundColor White
Write-Host "  Baselines : ScubaGear $($pinned.tag) ($($pinned.controlCount) controls)" -ForegroundColor White
Write-Host ""
Write-Host "  Power Platform follow-up:" -ForegroundColor Yellow
Write-Host "  1. Custom connector -> Edit -> Swagger Editor" -ForegroundColor White
Write-Host "     Paste the contents of: $specOut" -ForegroundColor DarkGray
Write-Host "     Adds the new 'product' parameter to ListControls / GetSectionSummary." -ForegroundColor DarkGray
Write-Host "  2. Update connector, then re-test the operations." -ForegroundColor White
Write-Host "  3. Canvas app needs no rebuild - it reads products from the API response." -ForegroundColor White
Write-Host "  4. Copilot Studio: refresh the tool list so it picks up 'product'." -ForegroundColor White
Write-Host ""
if ($UpdateBaselines) {
    Write-Host "  Baseline data changed - commit:" -ForegroundColor Yellow
    Write-Host "    git add azure-functions/src/shared/baseline-data.generated.ts azure-functions/scubagear-version.json" -ForegroundColor DarkGray
    Write-Host ""
}
