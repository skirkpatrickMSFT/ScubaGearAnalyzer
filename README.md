# ScubaGear Analyzer

Analyze CISA ScubaGear assessment results with an interactive Power Apps dashboard and AI-powered remediation chat. Upload your `TestResults.json` from a ScubaGear run and get compliance insights grounded in CISA baselines and Microsoft Learn documentation.

## What's Included

| Component | Description |
|-----------|-------------|
| `azure-functions/` | TypeScript Azure Functions backend — JSON parsing, baseline lookups, Learn docs, GPT-4o chat |
| `infra/` | Bicep deployment template (`functions.bicep`) |
| `power-apps/` | Power Apps canvas app build guide + source files |
| `copilot-studio/` | Copilot Studio agent definition |
| `deploy-functions.ps1` | One-click Azure Functions deployment script |
| `DEPLOYMENT-GUIDE.md` | End-to-end deployment walkthrough |
| `test-subset.json` | Sample ScubaGear results for testing |

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Power Platform                      │
│  ┌──────────────┐    ┌────────────────────┐     │
│  │  Power Apps   │    │  Copilot Studio    │     │
│  │  Canvas App   │    │  Agent             │     │
│  └──────┬───────┘    └────────┬───────────┘     │
│         └──────┬──────────────┘                  │
│     ┌──────────▼──────────┐                     │
│     │  Custom Connector   │                     │
│     └──────────┬──────────┘                     │
└────────────────┼────────────────────────────────┘
                 │ HTTPS + API Key
┌────────────────▼────────────────────────────────┐
│           Azure Functions                        │
│  /api/parse-results  — ScubaGear JSON parser    │
│  /api/baseline/*     — CISA baseline data       │
│  /api/learn/*        — Microsoft Learn proxy    │
│  /api/chat           — GPT-4o AI chat           │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- **Azure subscription**
- **Azure CLI** (`az`) installed and logged in
- **Node.js 20+**
- **OpenAI API key** (GPT-4o)
- **Power Platform environment** (for Power Apps + Copilot Studio)

## Quick Start — Power Apps Deployment

For a complete end-to-end walkthrough, see **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)**.

### 1. Set up your environment

```powershell
# Copy the example env file and add your OpenAI key
Copy-Item .env.example .env
# Edit .env and set: OPENAI_API_KEY=sk-your-key-here
```

### 2. Deploy Azure Functions

```powershell
.\deploy-functions.ps1 -ResourceGroupName <your-rg-name> -Location eastus
```

This deploys the Function App, builds the TypeScript code, and outputs your **Function App URL** and **Host Key**.

### 3. Create Custom Connector

1. In Power Apps → **Custom Connectors** → **Import OpenAPI file**
2. Upload `azure-functions/openapi.json`
3. Set the **Host** to your Function App URL (from step 2)
4. Set **Security** → API Key → Header → `x-functions-key`
5. Create a connection using your Host Key

See [POWER-PLATFORM-DEPLOY.md](POWER-PLATFORM-DEPLOY.md) for detailed steps.

### 4. Build the Power Apps Canvas App

Follow the step-by-step guide in [power-apps/README.md](power-apps/README.md).

### 5. Set up Copilot Studio (optional)

Follow [copilot-studio/README.md](copilot-studio/README.md) to create an AI agent.

## Supported Products

The analyzer includes full baseline data for all CISA ScubaGear products:

- **Microsoft Entra ID** (AAD) — 18 controls
- **Exchange Online** (EXO) — 18 controls
- **Microsoft Defender** — 10 controls
- **Power Platform** — 7 controls
- **SharePoint Online** — 8 controls
- **Microsoft Teams** — 10 controls

## ScubaGear JSON Format

The app expects the standard `TestResults.json` array:

```json
[
  {
    "ActualValue": "...",
    "Commandlet": ["Get-MgBetaIdentityConditionalAccessPolicy"],
    "Criticality": "Shall",
    "PolicyId": "MS.AAD.1.1v1",
    "ReportDetails": "1 conditional access policy(s) found...",
    "RequirementMet": true
  }
]
```

It also accepts the wrapper format: `{ "Results": [...] }`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/parse-results` | POST | Parse ScubaGear JSON results |
| `/api/baseline/controls` | GET | List all baseline controls |
| `/api/baseline/control?controlId=...` | GET | Get control details |
| `/api/baseline/remediation?controlId=...` | GET | Get remediation steps |
| `/api/baseline/search?query=...` | GET | Search controls by keyword |
| `/api/baseline/section?number=...` | GET | Get section summary |
| `/api/learn/control-docs?controlId=...` | GET | Get Learn docs for a control |
| `/api/learn/search?query=...` | GET | Search Microsoft Learn |
| `/api/learn/article?url=...` | GET | Fetch a Learn article |
| `/api/chat` | POST | AI-powered compliance chat |

## Local Development

```powershell
cd azure-functions
npm install
npm run build

$env:OPENAI_API_KEY = "<your-key>"
func start
```

## Teardown

```powershell
.\teardown.ps1 -ResourceGroupName <your-rg-name>
```

## Packaging for Distribution

```powershell
.\package.ps1
```

Creates `release\ScubaGearAnalyzer.zip` — a clean package with no secrets, no `node_modules`, and no build artifacts. Safe to share with any organization.

## License

Internal use only. Contains references to CISA ScubaGear baseline policies.