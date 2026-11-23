# ScubaGear Analyzer — Deployment Guide

A step-by-step guide to deploy the ScubaGear Analyzer from scratch. Two paths
are available — choose whichever suits your organization.

| Path | Best for | Time |
|------|----------|------|
| **[One-Click Deploy](#one-click-deploy-to-azure)** | Quick setup, minimal tooling | ~10 min |
| **[Full Manual Deploy](#phase-1-prerequisites)** | Full control, CI/CD, customization | ~30 min |

---

## One-Click Deploy to Azure

Use the **Deploy to Azure** button to create all infrastructure through the Azure Portal, then deploy the function code and import the Power App.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FskirkpatrickMSFT%2FScubaGearAnalyzer%2Fmain%2Fazuredeploy.json)

### Step 1 — Deploy Infrastructure

1. Click the button above (or paste the link into your browser)
2. Sign in to the Azure Portal if prompted
3. Fill in the form:
   - **Subscription**: select your Azure subscription
   - **Resource group**: click **Create new** → name it (e.g., `rg-scubagear`)
   - **Region**: select your preferred region
   - **Ai Provider**: `openai` (default) or `azure`
   - **OpenAI Api Key**: paste your GPT-4o key (when using `openai`)
   - **Azure Open Ai Endpoint** / **Azure Open Ai Deployment**: your existing Azure OpenAI or Azure AI Foundry endpoint and model deployment name (when using `azure`; no key is needed — the template grants the function app's Managed Identity the *Cognitive Services OpenAI User* role on that account, which requires you to be Owner or User Access Administrator on it)
   - Leave other fields at their defaults
4. Click **Review + create** → **Create**
5. Wait for deployment (~2–3 minutes)
6. When complete, click **Outputs** to copy:
   - `functionAppName` — e.g., `scubagear-func-abc123xyz`
   - `functionAppUrl` — e.g., `https://scubagear-func-abc123xyz.azurewebsites.net`

### Step 2 — Deploy Function Code

The ARM template creates the infrastructure but **not** the function code. Choose one method:

**Option A — GitHub Actions (recommended for teams)**

1. Fork this repository to your organization's GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Add a **Repository variable** named `AZURE_FUNCTIONAPP_NAME` with the value from Step 1
4. Add a **Repository secret** named `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`:
   - In the Azure Portal, go to your Function App → **Overview** → **Get publish profile**
   - Copy the entire XML content and paste as the secret value
5. Go to **Actions** → **Build & Deploy Functions** → **Run workflow** → Click **Run workflow**

**Option B — Local deploy (quickest for one person)**

```powershell
git clone https://github.com/skirkpatrickMSFT/ScubaGearAnalyzer.git
cd ScubaGearAnalyzer/azure-functions
npm ci
npm run build
func azure functionapp publish <your-function-app-name> --javascript
```

### Step 3 — Get Your Host Key

```powershell
az functionapp keys list --name <your-function-app-name> --resource-group <your-rg> --query "functionKeys.default" -o tsv
```

Save this key — you'll need it for the Custom Connector.

### Step 4 — Continue with Power Platform Setup

Jump to **[Phase 4: Create the Custom Connector](#phase-4-create-the-custom-connector)** below, then import the Power App from `power-apps/`.

---

## Full Manual Deploy (Phase-by-Phase)

---

## Phase 1: Prerequisites

Before you begin, make sure the following are available in your environment.

| Requirement | Details |
|-------------|---------|
| **Azure subscription** | Any subscription where you can create resource groups |
| **Azure CLI** | Install from [https://aka.ms/installazurecli](https://aka.ms/installazurecli), then run `az login` |
| **Node.js 22+** | Install from [https://nodejs.org](https://nodejs.org) |
| **AI model for chat** | Either an OpenAI API key (GPT-4o) from [https://platform.openai.com](https://platform.openai.com), or an existing Azure OpenAI / Azure AI Foundry chat model deployment (no key; uses Managed Identity) |
| **Power Platform environment** | With Power Apps access (Copilot Studio is optional) |

Verify your tools:

```powershell
az --version       # Azure CLI
node --version     # Node.js 22+
```

---

## Phase 2: Download and Configure

### 2.1 Get the files

Clone the repository (or unzip the distribution package):

```powershell
git clone https://github.com/<your-org>/ScubaGearAnalyzer.git
cd ScubaGearAnalyzer
```

### 2.2 Configure your AI provider

**OpenAI:**

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the placeholder with your actual key:

```
OPENAI_API_KEY=sk-your-key-here
```

> The deployment script reads this file automatically. You can also pass the
> key directly with `-OpenAiApiKey` if you prefer.

**Azure OpenAI / Azure AI Foundry (no key):** skip `.env` and pass your endpoint and deployment instead:

```powershell
.\deploy-functions.ps1 -ResourceGroupName <your-rg-name> `
    -AzureOpenAiEndpoint https://<resource>.openai.azure.com -AzureOpenAiDeployment <deployment-name>
```

The script grants the function app's Managed Identity **Cognitive Services OpenAI User** on that account.
If you cannot assign roles there, add `-SkipAzureOpenAiRoleAssignment` and ask an administrator to assign it;
use `-AzureOpenAiAccountName` / `-AzureOpenAiResourceGroup` if the account is in another resource group.

---

## Phase 3: Deploy Azure Functions

This single command creates all Azure resources and deploys the backend:

```powershell
.\deploy-functions.ps1 -ResourceGroupName <your-rg-name> -Location eastus
```

**What it does:**

1. Creates the resource group (if it doesn't exist)
2. Deploys infrastructure via Bicep (Function App + Storage Account + results storage account/container + Application Insights)
3. Installs npm dependencies and builds the TypeScript project
4. Publishes the compiled functions to Azure
5. Outputs three values you'll need for the next phase:

```
  Function App URL : https://<your-app>.azurewebsites.net
  Function App Name: <your-app>
  Host Key         : <your-host-key>
```

**Save these values** — you'll use them in Phase 4.

### Storage authentication

The storage endpoints (`list-blobs` and `fetch-blob`) support two authentication
methods:

| Method | When to use | Setup |
|--------|-------------|-------|
| **SAS Token** | Quick testing, cross-tenant access, or users who should not rely on the app's identity | Pass a `sasToken` parameter in each request. On the results account created by the template it must be a **user-delegation SAS** (shared-key access is disabled there); account-key SAS tokens work only against external accounts that allow shared keys |
| **Managed Identity** | Production, same-tenant | Omit `sasToken` — the function app uses its system-assigned identity |

Managed Identity is enabled automatically during deployment. The deployment also
**creates a dedicated results storage account and a private `scubagear-output` container**
for ScubaGear output, and grants the function app **Storage Blob Data Reader** on it. The function app's own
storage uses identity-based connections (no account keys), with the identity holding the Blob/Queue/Table data roles. Both accounts
sit behind private endpoints by default. The account and container names are shown in the deployment summary and
in the template outputs `resultsStorageAccountName` / `resultsContainerName` — enter them on the
Power App's **Load from Storage** screen with *Use Managed Identity* turned on.

| Parameter | Effect |
|-----------|--------|
| `-SkipResultsStorage` (template: `createResultsStorage = false`) | Don't create the account/container, e.g. when you already have one |
| `-ResultsStorageAccountName` (template: `resultsStorageAccountName`) | Name of the account that is created (3-24 lowercase letters/digits, globally unique). Auto-generated if omitted |
| `-ResultsContainerName` (template: `resultsContainerName`) | Container name. Default `scubagear-output` |
| `-DisablePrivateEndpoints` (template: `enablePrivateEndpoints = false`) | Skip the VNet and private endpoints |
| `-ResultsStorageAllowedIpRanges` (template: `resultsStorageAllowedIpRanges`) | Public IPs/CIDRs allowed to reach the results account. With private endpoints on and none given, the account is reachable only privately |
| `-VnetAddressPrefix` (template: `vnetAddressPrefix`) | VNet address space, at least a /24. Default `10.40.0.0/24` |

Both storage accounts use **identity-only access** (no account keys) and, by default, **private endpoints**, so the
deployment complies with Azure Baseline Security Mode. The function app's identity is given the data-plane roles it
needs. See the README's *Security and networking* section for details.

To get results into the results account, point ScubaConnect (or any scheduled ScubaGear run) at the container, or
upload a file yourself. Uploading needs **Storage Blob Data Contributor** on the account for your own user, and — with
private endpoints on — your public IP in `-ResultsStorageAllowedIpRanges`:

```powershell
az storage blob upload --auth-mode login --account-name <results-account> `
    -c scubagear-output -f ScubaResults.json -n ScubaResults.json
```

#### Creating a SAS token for the results account

Shared-key access is disabled, so create a **user-delegation SAS**, which is signed with your Entra ID credentials.
Paste the result into the Power App's SAS Token field. The app needs only read + list on the container:

```powershell
$expiry = (Get-Date).AddDays(6).ToString("yyyy-MM-ddTHH:mmZ")   # user-delegation SAS lasts at most 7 days
az storage container generate-sas --as-user --auth-mode login `
    --account-name <results-account> --name scubagear-output `
    --permissions rl --expiry $expiry --https-only --output tsv
```

You need **Storage Blob Delegator** plus **Storage Blob Data Reader** (or Contributor) on the account. Requesting a
user-delegation key is a call to the account's blob endpoint, so it has to run from somewhere that can reach the
private endpoint (a VM or VPN/ExpressRoute-connected network in or peered to the VNet). Run from anywhere else, it fails
with a network error while public access is disabled. Using the function app's Managed Identity (leave the SAS field
empty) needs none of this.

To grant access to a storage account you already have (e.g., where ScubaGear
uploads results), re-run the deployment with:

```powershell
.\deploy-functions.ps1 -ResourceGroupName <your-rg-name> `
    -ExternalStorageAccountName <storage-name> `
    -ExternalStorageResourceGroup <storage-rg>   # optional, defaults to same RG
```

Or assign the role manually via the Azure CLI:

```powershell
$principalId = az functionapp identity show `
    --name <your-func-app> --resource-group <your-rg> `
    --query principalId -o tsv

$storageId = az storage account show `
    --name <storage-name> --resource-group <storage-rg> `
    --query id -o tsv

az role assignment create `
    --assignee $principalId `
    --role "Storage Blob Data Reader" `
    --scope $storageId
```

> **Note:** RBAC role assignments can take up to 5 minutes to propagate.

### Verify the deployment

Test an endpoint to confirm the functions are running:

```powershell
curl "https://<your-app>.azurewebsites.net/api/baseline/controls?code=<your-host-key>"
```

You should receive a JSON array of baseline controls.

---

## Phase 4: Create the Custom Connector

The Custom Connector bridges Power Platform to your Azure Functions.

1. Go to [Power Apps](https://make.powerapps.com) → **More** → **Discover all** → **Custom Connectors**
2. Click **+ New custom connector** → **Import an OpenAPI file**
3. Name it **APIScubaGearAnalyzer** and upload `azure-functions/openapi.json`
4. On the **General** tab:
   - **Host**: paste your Function App hostname (e.g., `<your-app>.azurewebsites.net`)
   - **Base URL**: `/api`
5. On the **Security** tab:
   - Authentication type: **API Key**
   - Parameter label: `API Key`
   - Parameter name: `x-functions-key`
   - Parameter location: **Header**
6. Click **Create connector**
7. Go to the **Test** tab → **+ New connection** → paste your **Host Key** from Phase 3
8. Test the `ListControls` action to verify it returns data

> For a more detailed walkthrough with screenshots context, see
> [POWER-PLATFORM-DEPLOY.md](POWER-PLATFORM-DEPLOY.md).

---

## Phase 5: Deploy the Power Apps Canvas App

Two options:

### Option A — Import the Pre-built App (Fastest)

1. In [Power Apps](https://make.powerapps.com) → **Apps** → **Import canvas app**
2. Upload `power-apps/ScubaGearAnalyzer_<date>.zip`
3. Set import action to **Create as new**
4. Click **Import**
5. Open the imported app in **Edit** mode → **Data** panel → **+ Add data** → select your **APIScubaGearAnalyzer** connector
6. If prompted, enter your API key (Host Key from Phase 3)
7. Save and publish

See [power-apps/README.md](power-apps/README.md) for detailed import instructions.

### Option B — Build from Scratch

Follow the complete build guide:

> **[power-apps/README.md](power-apps/README.md)** — Step-by-step instructions
> to create the canvas app from scratch, including all three screens (Upload,
> Controls, Chat), galleries, formulas, and connector integration.

**Quick overview of what you'll build:**

| Screen | Purpose |
|--------|---------|
| **Upload** | Paste JSON, load from Blob Storage, toggle Managed Identity vs SAS Token auth |
| **Controls** | Browse and filter individual control results by product |
| **Chat** | Ask the AI assistant questions about failures, remediation, and baselines |

Once complete, **publish** the app and share it with your security team.

---

## Phase 6: Set Up Copilot Studio Agent (Optional)

Copilot Studio provides a conversational AI agent that can be embedded in Teams,
Power Apps, or used standalone. It calls the same Azure Functions backend through
the Custom Connector.

Follow the complete setup guide:

> **[copilot-studio/README.md](copilot-studio/README.md)** — Covers agent
> creation, system prompt configuration, adding connector actions as tools,
> optional topics, and testing.

**Quick overview:**

1. Create a new agent at [copilotstudio.microsoft.com](https://copilotstudio.microsoft.com)
2. Add your Custom Connector as a tool (the agent auto-discovers the actions)
3. Paste the system prompt from the guide (tells the agent how to interpret control IDs, format responses, etc.)
4. Test with: *"What is MS.AAD.3.1v1?"* or *"How do I fix legacy authentication?"*

---

## Phase 7: Verify End-to-End

Run through these checks to confirm everything is working:

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Open the Power App and upload `test-subset.json` | Summary cards show pass/fail counts |
| 2 | Navigate to the Controls screen | Gallery lists controls with Pass/Fail/Warning badges |
| 3 | Tap a failing control | Remediation panel shows steps and Learn links |
| 4 | Navigate to the Chat screen | Chat interface loads |
| 5 | Ask: *"What is MS.AAD.3.1v1?"* | AI responds with control details |
| 6 | Ask: *"How do I remediate MS.EXO.4.1v1?"* | AI responds with remediation steps and admin portal paths |
| 7 | Switch to Storage mode and enter storage details | Browse Files returns JSON blobs from the container |
| 8 | Toggle "Use Managed Identity" and click Browse Files | Blobs listed without a SAS token (requires RBAC setup from Phase 3) |
| 9 | Select a blob and click Load Selected | Results are parsed and displayed the same as pasted JSON |
| 10 | (If Copilot Studio) Test the agent in the Test pane | Agent calls connector actions and returns grounded answers |

---

## Teardown

To remove all Azure resources when you're done:

```powershell
.\teardown.ps1 -ResourceGroupName <your-rg-name>
```

This deletes the resource group and all resources within it. Power Platform
components (Custom Connector, Canvas App, and optionally the Copilot Studio Agent) must be removed
manually from their respective admin portals.

---

## Quick Reference

| What | Where |
|------|-------|
| Project overview | [README.md](README.md) |
| **Deploy to Azure (one-click)** | [azuredeploy.json](azuredeploy.json) |
| **GitHub Actions workflow** | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| Custom Connector details | [POWER-PLATFORM-DEPLOY.md](POWER-PLATFORM-DEPLOY.md) |
| Canvas app build guide | [power-apps/README.md](power-apps/README.md) |
| **Power App export (.zip)** | [power-apps/](power-apps/) |
| Copilot Studio setup (optional) | [copilot-studio/README.md](copilot-studio/README.md) |
| API endpoint reference | [README.md → API Endpoints](README.md) |
| Azure Functions deployment | [deploy-functions.ps1](deploy-functions.ps1) |
| Infrastructure template (Bicep) | [infra/functions.bicep](infra/functions.bicep) |
| Infrastructure template (ARM) | [azuredeploy.json](azuredeploy.json) |
| OpenAPI spec | [azure-functions/openapi.json](azure-functions/openapi.json) |
| Sample test data | [test-subset.json](test-subset.json) |
