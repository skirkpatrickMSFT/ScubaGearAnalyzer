<#
.SYNOPSIS
    Deploys the ScubaGear Analyzer Azure Functions backend for Power Apps + Copilot Studio.

.DESCRIPTION
    1. Creates a resource group (if not exists)
    2. Deploys Azure Functions infrastructure via Bicep
    3. Builds and deploys the Azure Functions code
    4. Outputs the function app URL and host key for connector setup

.PARAMETER ResourceGroupName
    Name of the Azure resource group.

.PARAMETER Location
    Azure region. Default: eastus.

.PARAMETER BaseName
    Base name for all resources. Default: scubagear.

.PARAMETER OpenAiApiKey
    OpenAI API key. Prompts if not provided.

.EXAMPLE
    .\deploy-functions.ps1 -ResourceGroupName rg-scubagear-functions -Location eastus
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [string]$Location = "eastus",
    [string]$BaseName = "scubagear",
    [string]$OpenAiApiKey = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Info([string]$msg) { Write-Host "  ℹ $msg" -ForegroundColor Yellow }

# ── Prerequisites ───────────────────────────────────────────
Write-Step "Checking prerequisites"

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI ('az') not found. Please install it."
}

if (-not (Get-Command func -ErrorAction SilentlyContinue)) {
    Write-Info "Azure Functions Core Tools ('func') not found. Installing..."
    npm install -g azure-functions-core-tools@4 --unsafe-perm true
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js not found. Please install Node.js 20+."
}

# ── OpenAI Key ──────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($OpenAiApiKey)) {
    if (Test-Path ".env") {
        $envLine = Get-Content ".env" | Where-Object { $_ -match '^OPENAI_API_KEY=' }
        if ($envLine) {
            $OpenAiApiKey = ($envLine -split '=', 2)[1].Trim()
            Write-OK "Loaded OPENAI_API_KEY from .env"
        }
    }
    if ([string]::IsNullOrWhiteSpace($OpenAiApiKey)) {
        $OpenAiApiKey = Read-Host -Prompt "Enter your OpenAI API key"
    }
}

# ── Ensure logged in ───────────────────────────────────────
Write-Step "Verifying Azure CLI login"
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Info "Not logged in. Running 'az login'..."
    az login
}
Write-OK "Logged in as $($account.user.name) (subscription: $($account.name))"

# ── Resource Group ──────────────────────────────────────────
Write-Step "Ensuring resource group '$ResourceGroupName' in '$Location'"
az group create --name $ResourceGroupName --location $Location --output none
Write-OK "Resource group ready"

# ── Deploy Bicep ────────────────────────────────────────────
Write-Step "Deploying Azure Functions infrastructure via Bicep"
$deployResult = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "infra/functions.bicep" `
    --parameters baseName=$BaseName openAiApiKey=$OpenAiApiKey `
    --output json | ConvertFrom-Json

$funcAppName = $deployResult.properties.outputs.functionAppName.value
$funcAppUrl  = $deployResult.properties.outputs.functionAppUrl.value

Write-OK "Function App: $funcAppName"
Write-OK "URL: $funcAppUrl"

# ── Build Functions ─────────────────────────────────────────
Write-Step "Building Azure Functions project"
Push-Location "azure-functions"
npm install
npm run build
Write-OK "Build complete"

# ── Deploy Functions Code ───────────────────────────────────
Write-Step "Deploying function code to $funcAppName"
func azure functionapp publish $funcAppName --javascript
Pop-Location
Write-OK "Functions deployed"

# ── Get Host Key ────────────────────────────────────────────
Write-Step "Retrieving function host key for connector setup"
$hostKey = az functionapp keys list `
    --resource-group $ResourceGroupName `
    --name $funcAppName `
    --query "functionKeys.default" `
    --output tsv

# ── Summary ─────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ScubaGear Analyzer Functions — Deployed Successfully" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Function App URL : $funcAppUrl" -ForegroundColor White
Write-Host "  Function App Name: $funcAppName" -ForegroundColor White
Write-Host "  Host Key         : $hostKey" -ForegroundColor White
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Create a Custom Connector in Power Apps / Power Automate" -ForegroundColor White
Write-Host "     - Import azure-functions/openapi.json" -ForegroundColor White
Write-Host "     - Set host to: $($funcAppUrl -replace 'https://','')" -ForegroundColor White
Write-Host "     - Set API key to the host key above" -ForegroundColor White
Write-Host ""
Write-Host "  2. Create a Copilot Studio agent" -ForegroundColor White
Write-Host "     - See copilot-studio/README.md for instructions" -ForegroundColor White
Write-Host ""
Write-Host "  3. Test endpoints:" -ForegroundColor White
Write-Host "     curl '$funcAppUrl/api/baseline/controls?code=$hostKey'" -ForegroundColor DarkGray
Write-Host "     curl '$funcAppUrl/api/baseline/control?controlId=MS.AAD.1.1v1&code=$hostKey'" -ForegroundColor DarkGray
Write-Host ""
