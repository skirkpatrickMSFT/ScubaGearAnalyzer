# ScubaGear Analyzer — Power Platform Deployment

This guide covers deploying the ScubaGear Analyzer as a **Power Apps** dashboard
backed by **Azure Functions**, with an optional **Copilot Studio** AI agent.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Power Platform                     │
│  ┌──────────────┐    ┌────────────────────┐     │
│  │  Power Apps  │    │  Copilot Studio    │     │
│  │  Canvas App  │    │  Agent (optional)  │     │
│  │  (Dashboard) │    │  (AI Chat)         │     │
│  └──────┬───────┘    └────────┬───────────┘     │
│         │                     │                 │
│         └──────┬──────────────┘                 │
│                │                                │
│     ┌──────────▼──────────┐                     │
│     │  Custom Connector   │                     │
│     │  (OpenAPI spec)     │                     │
│     └──────────┬──────────┘                     │
└────────────────┼────────────────────────────────┘
                 │ HTTPS + API Key
┌────────────────▼────────────────────────────────┐
│           Azure Functions                       │
│  ┌────────────────────────────────────────────┐ │
│  │ /api/baseline/*   — CISA baseline data     │ │
│  │ /api/learn/*      — Microsoft Learn proxy  │ │
│  │ /api/parse-results — ScubaGear JSON parser │ │
│  │ /api/chat         — GPT-4o orchestration   │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- **Azure subscription** (for Azure Functions)
- **Azure CLI** (`az`) installed
- **Node.js 22+**
- **Azure Functions Core Tools** (`func`)
- **An AI model for chat**: an OpenAI API key (GPT-4o), or an existing Azure OpenAI / Azure AI Foundry deployment
- **Power Platform environment** with Power Apps access (Copilot Studio optional)

## Quick Start

### 1. Deploy Azure Functions Backend

```powershell
.\deploy-functions.ps1 -ResourceGroupName rg-scubagear-functions -Location eastus
```

This will:
- Create the Azure resource group
- Deploy Function App + Storage + App Insights via Bicep
- Build and deploy the TypeScript Azure Functions
- Output the Function App URL and host key

### 2. Create Custom Connector

1. Go to **Power Apps** → **More** → **Discover all** → **Custom Connectors**
2. Click **+ New custom connector** → **Import an OpenAPI file**
3. Upload [`azure-functions/openapi.json`](azure-functions/openapi.json)
4. On the **General** tab:
   - Set **Host** to your Function App hostname (e.g., `<your-function-app>.azurewebsites.net`)
   - Set **Base URL** to `/api`
5. On the **Security** tab:
   - Authentication type: **API Key**
   - Parameter label: `API Key`
   - Parameter name: `x-functions-key`
   - Parameter location: **Header**
6. Click **Create connector**
7. Go to **Test** tab, create a connection with your function host key, and test `ListControls`

### 3. Create Copilot Studio Agent (Optional)

If you want a conversational AI agent in addition to the Power Apps dashboard,
follow the detailed instructions in [`copilot-studio/README.md`](copilot-studio/README.md).
This step is **not required** — the Power Apps canvas app includes its own
built-in AI chat screen that calls the Azure Functions `/api/chat` endpoint directly.

Summary:
1. Create a new agent in [Copilot Studio](https://copilotstudio.microsoft.com)
2. Add the custom connector as a plugin
3. Configure the system prompt from the agent definition
4. Add connector actions (GetControlInfo, SearchBaseline, Chat, etc.)
5. Test with: "What is MS.AAD.3.1v1?"

### 4. Build Power Apps Dashboard

**Option A — Import the pre-built app** (fastest): Import the `.zip` file from `power-apps/` and add the connector. See [power-apps/README.md](power-apps/README.md) Option A.

**Option B — Build from scratch**: Create a Canvas App with:
- **Paste JSON or load from Azure Blob Storage** — dual-mode upload with **Managed Identity toggle**
- **Summary cards** showing pass/fail/manual/omitted counts
- **Product gallery** with per-product pass rates
- **Controls table** with status filtering and **exclusion analysis notes** for CAP controls
- **AI chat screen** calling the `/api/chat` endpoint directly (or optionally embedding a Copilot Studio agent)

The upload screen includes a **Use Managed Identity** toggle. When enabled, storage
calls skip SAS tokens and use the function app’s system-assigned identity instead.
This requires the RBAC role assignment described in the deployment guide.

Supports ScubaGear 1.5–2.0.0 output, including omitted controls, exemptions, and
Conditional Access Policy exclusion analysis.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/baseline/control?controlId=...` | GET | Get control details |
| `/api/baseline/controls?section=...` | GET | List controls (optional section filter) |
| `/api/baseline/remediation?controlId=...` | GET | Get remediation steps |
| `/api/baseline/search?query=...` | GET | Search controls by keyword |
| `/api/baseline/section?number=...` | GET | Get section summary |
| `/api/baseline/changes?from=...&to=...` | GET | What changed between ScubaGear releases |
| `/api/baseline/releases` | GET | Releases covered by the change history, with release notes |
| `/api/learn/search?query=...` | GET | Search Microsoft Learn |
| `/api/learn/control-docs?controlId=...` | GET | Get Learn docs for a control |
| `/api/learn/article?url=...` | GET | Fetch a Learn article |
| `/api/parse-results` | POST | Parse ScubaGear JSON results |
| `/api/storage/list-blobs` | GET | List JSON blobs in a storage container |
| `/api/storage/fetch-blob` | POST | Fetch a blob from storage and parse it |
| `/api/chat` | POST | AI-powered compliance chat |

## Local Development

```powershell
cd azure-functions
npm install
npm run build

# Set your OpenAI key (or AI_PROVIDER=azure with AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_DEPLOYMENT)
$env:OPENAI_API_KEY = "sk-..."

# Start locally
func start
```

Test with:
```powershell
# List all controls
curl http://localhost:7071/api/baseline/controls

# Get a specific control
curl "http://localhost:7071/api/baseline/control?controlId=MS.AAD.1.1v1"

# Search
curl "http://localhost:7071/api/baseline/search?query=MFA"

# Chat
curl -X POST http://localhost:7071/api/chat `
  -H "Content-Type: application/json" `
  -d '{"message": "What is MS.AAD.3.1v1 and how do I fix it?"}'
```

## Project Structure

```
azure-functions/
├── host.json                    # Azure Functions host config
├── local.settings.json          # Local dev settings
├── openapi.json                 # OpenAPI spec for custom connector
├── package.json
├── tsconfig.json
└── src/
    ├── functions/
    │   ├── baseline-getControlInfo.ts
    │   ├── baseline-getRemediation.ts
    │   ├── baseline-getSectionSummary.ts
    │   ├── baseline-listControls.ts
    │   ├── baseline-search.ts
    │   ├── chat.ts                      # GPT-4o orchestration
    │   ├── learn-getArticle.ts
    │   ├── learn-getControlDocs.ts
    │   ├── learn-search.ts
    │   ├── parse-results.ts             # ScubaGear JSON parser
    │   ├── storage-fetchBlob.ts         # Fetch & parse blob from storage
    │   └── storage-listBlobs.ts         # Browse Azure Blob Storage
    └── shared/
        ├── baseline-data.ts             # CISA baseline control definitions
        ├── learn-fetcher.ts             # Microsoft Learn API client
        ├── scubagear-parser.ts          # JSON parser + summary builder
        └── types.ts                     # Shared TypeScript types

copilot-studio/                          # Optional — alternative chat interface
├── README.md                    # Copilot Studio setup instructions
└── agent-definition.yaml        # Agent config (topics, actions, prompts)

infra/
└── functions.bicep              # Azure Functions Bicep template

deploy-functions.ps1             # One-click deployment script
```

## Teardown

```powershell
az group delete --name rg-scubagear-functions --yes --no-wait
```
