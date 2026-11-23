<#
.SYNOPSIS
    Deploys the ScubaGear Analyzer Azure Functions backend for Power Apps (and optionally Copilot Studio).

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

.PARAMETER AiProvider
    Chat model provider: 'openai' (OpenAI API key) or 'azure' (Azure OpenAI / Azure AI Foundry
    with the function app's Managed Identity). Defaults to 'azure' when -AzureOpenAiEndpoint is
    supplied, otherwise 'openai'.

.PARAMETER OpenAiApiKey
    OpenAI API key (openai provider only). Prompts if not provided.

.PARAMETER AzureOpenAiEndpoint
    Azure OpenAI endpoint, e.g. https://my-resource.openai.azure.com (azure provider).

.PARAMETER AzureOpenAiDeployment
    Name of the model deployment to call (azure provider).

.PARAMETER AzureOpenAiAccountName
    Existing Azure OpenAI / AI Services account name, used for the role assignment.
    Defaults to the first label of the endpoint host.

.PARAMETER AzureOpenAiResourceGroup
    Resource group of the Azure OpenAI account. Defaults to ResourceGroupName.

.PARAMETER SkipAzureOpenAiRoleAssignment
    Do not assign 'Cognitive Services OpenAI User' to the function app. Use this if you lack
    permission to assign roles on the account and will have someone else do it.

.PARAMETER SkipResultsStorage
    Do not create the dedicated results storage account and container. By default a storage
    account plus a private container are created for ScubaGear output, and the function app's
    Managed Identity is granted Storage Blob Data Reader on it.

.PARAMETER DisablePrivateEndpoints
    Do not create the VNet, private DNS zones and private endpoints. Storage is still
    identity-only (no account keys) but is reachable over the public network.

.PARAMETER VnetAddressPrefix
    Address space for the VNet (at least a /24). Default: 10.40.0.0/24.

.PARAMETER ResultsStorageAllowedIpRanges
    Public IPs or CIDR ranges allowed to reach the results storage account, for example where
    ScubaGear runs or where you upload from. With private endpoints enabled (the default) and
    no ranges, the results account is reachable only through its private endpoint.

.PARAMETER ResultsContainerName
    Name of the results container. Default: scubagear-output.

.PARAMETER ResultsStorageAccountName
    Name for the results storage account that is created (3-24 lowercase letters/digits,
    globally unique). Defaults to an auto-generated name. To use a storage account that already
    exists instead, pass -SkipResultsStorage and -ExternalStorageAccountName.

.EXAMPLE
    .\deploy-functions.ps1 -ResourceGroupName rg-scubagear-functions -Location eastus

.EXAMPLE
    .\deploy-functions.ps1 -ResourceGroupName rg-scubagear-functions `
        -AzureOpenAiEndpoint https://my-resource.openai.azure.com -AzureOpenAiDeployment gpt-4o
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [string]$Location = "eastus",
    [string]$BaseName = "scubagear",

    [ValidateSet("", "openai", "azure")]
    [string]$AiProvider = "",
    [string]$OpenAiApiKey = "",
    [string]$AzureOpenAiEndpoint = "",
    [string]$AzureOpenAiDeployment = "",
    [string]$AzureOpenAiAccountName = "",
    [string]$AzureOpenAiResourceGroup = "",
    [switch]$SkipAzureOpenAiRoleAssignment,

    [Parameter(HelpMessage = "Do not create the dedicated results storage account and container.")]
    [switch]$SkipResultsStorage,

    [Parameter(HelpMessage = "Name of the blob container created for ScubaGear results. Default: scubagear-output.")]
    [string]$ResultsContainerName = "scubagear-output",

    [Parameter(HelpMessage = "Name for the results storage account that is CREATED (3-24 lowercase letters/digits, globally unique). Leave empty to auto-generate.")]
    [string]$ResultsStorageAccountName = "",

    [Parameter(HelpMessage = "Optional: name of an EXISTING storage account to grant the function app Managed Identity read access. Does not create it; use -ResultsStorageAccountName for that.")]
    [string]$ExternalStorageAccountName = "",

    [Parameter(HelpMessage = "Optional: resource group of the external storage account. Defaults to ResourceGroupName.")]
    [string]$ExternalStorageResourceGroup = "",

    [Parameter(HelpMessage = "Do not create the VNet and private endpoints. Storage stays identity-only but is reachable over the public network.")]
    [switch]$DisablePrivateEndpoints,

    [Parameter(HelpMessage = "Address space for the VNet (at least a /24). Default: 10.40.0.0/24.")]
    [string]$VnetAddressPrefix = "10.40.0.0/24",

    [Parameter(HelpMessage = "Public IPs/CIDRs allowed to reach the results storage account (e.g. where ScubaGear runs or you upload from). With private endpoints on, leaving this empty keeps the account private.")]
    [string[]]$ResultsStorageAllowedIpRanges = @()
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
    throw "Node.js not found. Please install Node.js 22+."
}

# ── AI provider ─────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($AiProvider)) {
    $AiProvider = if (-not [string]::IsNullOrWhiteSpace($AzureOpenAiEndpoint)) { "azure" } else { "openai" }
}

if ($AiProvider -eq "azure") {
    if ([string]::IsNullOrWhiteSpace($AzureOpenAiEndpoint)) {
        $AzureOpenAiEndpoint = Read-Host -Prompt "Enter your Azure OpenAI endpoint (e.g. https://my-resource.openai.azure.com)"
    }
    if ([string]::IsNullOrWhiteSpace($AzureOpenAiDeployment)) {
        $AzureOpenAiDeployment = Read-Host -Prompt "Enter your Azure OpenAI model deployment name"
    }
    if ([string]::IsNullOrWhiteSpace($AzureOpenAiEndpoint) -or [string]::IsNullOrWhiteSpace($AzureOpenAiDeployment)) {
        throw "Azure OpenAI requires both an endpoint and a deployment name."
    }
    Write-OK "Using Azure OpenAI ($AzureOpenAiDeployment) with Managed Identity - no API key needed"
}
elseif ([string]::IsNullOrWhiteSpace($OpenAiApiKey)) {
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
$deployParams = [ordered]@{
    baseName               = $BaseName
    aiProvider             = $AiProvider
    createResultsStorage   = (-not $SkipResultsStorage.IsPresent)
    resultsContainerName   = $ResultsContainerName
    enablePrivateEndpoints = (-not $DisablePrivateEndpoints.IsPresent)
    vnetAddressPrefix      = $VnetAddressPrefix
}
if (-not [string]::IsNullOrWhiteSpace($ResultsStorageAccountName)) {
    $deployParams.resultsStorageAccountName = $ResultsStorageAccountName
}
if ($ResultsStorageAllowedIpRanges.Count -gt 0) {
    $deployParams.resultsStorageAllowedIpRanges = @($ResultsStorageAllowedIpRanges)
}
if ($AiProvider -eq "azure") {
    $deployParams.azureOpenAiEndpoint   = $AzureOpenAiEndpoint
    $deployParams.azureOpenAiDeployment = $AzureOpenAiDeployment
    if (-not [string]::IsNullOrWhiteSpace($AzureOpenAiAccountName)) {
        $deployParams.azureOpenAiAccountName = $AzureOpenAiAccountName
    }
    $deployParams.azureOpenAiResourceGroup = if ([string]::IsNullOrWhiteSpace($AzureOpenAiResourceGroup)) { $ResourceGroupName } else { $AzureOpenAiResourceGroup }
    $deployParams.assignAzureOpenAiRole    = (-not $SkipAzureOpenAiRoleAssignment.IsPresent)
}
else {
    $deployParams.openAiApiKey = $OpenAiApiKey
}
if (-not [string]::IsNullOrWhiteSpace($ExternalStorageAccountName)) {
    $deployParams.externalStorageAccountName = $ExternalStorageAccountName
    $deployParams.externalStorageResourceGroup = if ([string]::IsNullOrWhiteSpace($ExternalStorageResourceGroup)) { $ResourceGroupName } else { $ExternalStorageResourceGroup }
}

# A parameters file handles array values and keeps the OpenAI key off the process command line.
$paramsFile = Join-Path ([System.IO.Path]::GetTempPath()) "scubagear-deploy-$([guid]::NewGuid().ToString('N')).json"
$paramsDoc = [ordered]@{
    '$schema'      = "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#"
    contentVersion = "1.0.0.0"
    parameters     = [ordered]@{}
}
foreach ($key in $deployParams.Keys) { $paramsDoc.parameters[$key] = @{ value = $deployParams[$key] } }
$paramsDoc | ConvertTo-Json -Depth 6 | Set-Content -Path $paramsFile -Encoding UTF8

try {
    $deployJson = az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file "infra/functions.bicep" `
        --parameters "@$paramsFile" `
        --output json
    if ($LASTEXITCODE -ne 0) { throw "Infrastructure deployment failed. See the error above." }
    $deployResult = $deployJson | ConvertFrom-Json
}
finally {
    Remove-Item $paramsFile -Force -ErrorAction SilentlyContinue
}

$funcAppName = $deployResult.properties.outputs.functionAppName.value
$funcAppUrl  = $deployResult.properties.outputs.functionAppUrl.value
$resultsAccount   = $deployResult.properties.outputs.resultsStorageAccountName.value
$resultsContainer = $deployResult.properties.outputs.resultsContainerName.value

Write-OK "Function App: $funcAppName"
Write-OK "URL: $funcAppUrl"
if ($resultsAccount) { Write-OK "Results storage: $resultsAccount / $resultsContainer" }

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
if ($resultsAccount) {
    Write-Host "  Results Storage  : $resultsAccount (container: $resultsContainer)" -ForegroundColor White
}
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
if ($AiProvider -eq "azure") {
    Write-Host "  0. Chat uses Azure OpenAI ($AzureOpenAiDeployment) via Managed Identity." -ForegroundColor White
    if ($SkipAzureOpenAiRoleAssignment) {
        Write-Host "     Role assignment was skipped: grant 'Cognitive Services OpenAI User' to the function app's" -ForegroundColor White
        Write-Host "     system-assigned identity on the Azure OpenAI account." -ForegroundColor White
    } else {
        Write-Host "     'Cognitive Services OpenAI User' was assigned; role changes can take a few minutes to take effect." -ForegroundColor White
    }
    Write-Host ""
}
Write-Host "  1. Create a Custom Connector in Power Apps / Power Automate" -ForegroundColor White
Write-Host "     - Import azure-functions/openapi.json" -ForegroundColor White
Write-Host "     - Set host to: $($funcAppUrl -replace 'https://','')" -ForegroundColor White
Write-Host "     - Set API key to the host key above" -ForegroundColor White
Write-Host ""
Write-Host "  2. Storage access: Managed Identity is enabled automatically." -ForegroundColor White
Write-Host "     The function app can read blobs without a SAS token from:" -ForegroundColor White
Write-Host "     - Its own storage account (auto-configured)" -ForegroundColor White
if ($resultsAccount) {
    Write-Host "     - Results storage: $resultsAccount / $resultsContainer (created, RBAC assigned)" -ForegroundColor White
    if ((-not $DisablePrivateEndpoints) -and $ResultsStorageAllowedIpRanges.Count -eq 0) {
        Write-Host "       It is private (no public access). To upload from your machine, re-run with" -ForegroundColor DarkGray
        Write-Host "       -ResultsStorageAllowedIpRanges <your-public-ip>, or write to it from inside the VNet." -ForegroundColor DarkGray
    }
    Write-Host "       Point ScubaConnect (or upload ScubaResults.json) at this container. To upload manually:" -ForegroundColor DarkGray
    Write-Host "       az storage blob upload --auth-mode login --account-name $resultsAccount -c $resultsContainer -f ScubaResults.json -n ScubaResults.json" -ForegroundColor DarkGray
    Write-Host "       (uploading needs 'Storage Blob Data Contributor' on the account for your own user)" -ForegroundColor DarkGray
}
if (-not [string]::IsNullOrWhiteSpace($ExternalStorageAccountName)) {
    Write-Host "     - External storage: $ExternalStorageAccountName (RBAC assigned)" -ForegroundColor White
} else {
    Write-Host "     - To grant access to another storage account, re-run with:" -ForegroundColor DarkGray
    Write-Host "       -ExternalStorageAccountName <name> [-ExternalStorageResourceGroup <rg>]" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  3. (Optional) Create a Copilot Studio agent" -ForegroundColor White
Write-Host "     - See copilot-studio/README.md for instructions" -ForegroundColor White
Write-Host ""
Write-Host "  3. Test endpoints:" -ForegroundColor White
Write-Host "     curl '$funcAppUrl/api/baseline/controls?code=$hostKey'" -ForegroundColor DarkGray
Write-Host "     curl '$funcAppUrl/api/baseline/control?controlId=MS.AAD.1.1v1&code=$hostKey'" -ForegroundColor DarkGray
Write-Host ""
