# ScubaGear Analyzer — Deployment Guide

A step-by-step guide to deploy the ScubaGear Analyzer from scratch. Follow each
phase in order. Detailed instructions for specific components are linked where
applicable.

---

## Phase 1: Prerequisites

Before you begin, make sure the following are available in your environment.

| Requirement | Details |
|-------------|---------|
| **Azure subscription** | Any subscription where you can create resource groups |
| **Azure CLI** | Install from [https://aka.ms/installazurecli](https://aka.ms/installazurecli), then run `az login` |
| **Node.js 22+** | Install from [https://nodejs.org](https://nodejs.org) |
| **OpenAI API key** | GPT-4o key from [https://platform.openai.com](https://platform.openai.com) |
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

### 2.2 Set your OpenAI API key

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the placeholder with your actual key:

```
OPENAI_API_KEY=sk-your-key-here
```

> The deployment script reads this file automatically. You can also pass the
> key directly with `-OpenAiApiKey` if you prefer.

---

## Phase 3: Deploy Azure Functions

This single command creates all Azure resources and deploys the backend:

```powershell
.\deploy-functions.ps1 -ResourceGroupName <your-rg-name> -Location eastus
```

**What it does:**

1. Creates the resource group (if it doesn't exist)
2. Deploys infrastructure via Bicep (Function App + Storage Account + Application Insights)
3. Installs npm dependencies and builds the TypeScript project
4. Publishes the compiled functions to Azure
5. Outputs three values you'll need for the next phase:

```
  Function App URL : https://<your-app>.azurewebsites.net
  Function App Name: <your-app>
  Host Key         : <your-host-key>
```

**Save these values** — you'll use them in Phase 4.

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

## Phase 5: Build the Power Apps Canvas App

The canvas app gives your team an interactive dashboard for uploading ScubaGear
results, viewing compliance status, and chatting with the AI assistant.

Follow the complete build guide:

> **[power-apps/README.md](power-apps/README.md)** — Step-by-step instructions
> to create the canvas app from scratch, including all three screens (Upload,
> Controls, Chat), galleries, formulas, and connector integration.

**Quick overview of what you'll build:**

| Screen | Purpose |
|--------|---------|
| **Upload** | Paste a `TestResults.json` or load from Azure Blob Storage, view pass/fail summary |
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
| 8 | Select a blob and click Load Selected | Results are parsed and displayed the same as pasted JSON |
| 9 | (If Copilot Studio) Test the agent in the Test pane | Agent calls connector actions and returns grounded answers |

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
| Custom Connector details | [POWER-PLATFORM-DEPLOY.md](POWER-PLATFORM-DEPLOY.md) |
| Canvas app build guide | [power-apps/README.md](power-apps/README.md) |
| Copilot Studio setup (optional) | [copilot-studio/README.md](copilot-studio/README.md) |
| API endpoint reference | [README.md → API Endpoints](README.md) |
| Azure Functions deployment | [deploy-functions.ps1](deploy-functions.ps1) |
| Infrastructure template | [infra/functions.bicep](infra/functions.bicep) |
| OpenAPI spec | [azure-functions/openapi.json](azure-functions/openapi.json) |
| Sample test data | [test-subset.json](test-subset.json) |
