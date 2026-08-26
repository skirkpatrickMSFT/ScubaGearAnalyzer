# ScubaGear Analyzer

Analyze CISA ScubaGear assessment results with an interactive Power Apps dashboard and AI-powered remediation chat. Upload your `TestResults.json` from a ScubaGear run — or load results directly from Azure Blob Storage (e.g. a ScubaConnect output container) — and get compliance insights grounded in CISA baselines and Microsoft Learn documentation.

Supports **ScubaGear 1.5–1.8.0** output formats, including omitted controls, exemptions, incorrect-result overrides, per-control comments, and **Conditional Access Policy exclusion analysis** with per-policy user/group breakdown.

Baseline control data is **generated directly from the CISA baselines** at a pinned ScubaGear tag, so new releases are a regeneration rather than a hand edit. See [Updating baselines](#updating-baselines).

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FskirkpatrickMSFT%2FScubaGearAnalyzer%2Fmain%2Fazuredeploy.json)

## What's Included

| Component | Description |
|-----------|-------------|
| `azure-functions/` | TypeScript Azure Functions backend — JSON parsing, baseline lookups, Learn docs, storage integration, GPT-4o chat (12 endpoints) |
| `infra/` | Bicep deployment templates (`functions.bicep`, `external-storage-rbac.bicep`) |
| `power-apps/` | Power Apps canvas app — pre-built `.msapp` export + step-by-step build guide + source files |
| `copilot-studio/` | Copilot Studio agent definition *(optional — alternative chat interface)* |
| `deploy-functions.ps1` | One-click Azure Functions deployment script |
| `DEPLOYMENT-GUIDE.md` | End-to-end deployment walkthrough |

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Power Platform                     │
│  ┌──────────────┐    ┌────────────────────┐     │
│  │  Power Apps  │    │  Copilot Studio    │     │
│  │  Canvas App  │    │  Agent (optional)  │     │
│  └──────┬───────┘    └────────┬───────────┘     │
│         └──────┬──────────────┘                 │
│     ┌──────────▼──────────┐                     │
│     │  Custom Connector   │                     │
│     │ (APIScubaGearAnalyzer)                    │
│     └──────────┬──────────┘                     │
└────────────────┼────────────────────────────────┘
                 │ HTTPS + API Key
┌────────────────▼────────────────────────────────┐
│          Azure Functions (Flex Consumption)     │
│  /api/parse-results      — ScubaGear JSON parser│
│  /api/baseline/*         — CISA baseline data   │
│  /api/learn/*            — Microsoft Learn proxy│
│  /api/storage/list-blobs — Browse blob storage  │
│  /api/storage/fetch-blob — Load blob & parse    │
│  /api/chat               — GPT-4o AI chat       │
└──────────────────┬──────────────────────────────┘
                   │ SAS Token  — or —  Managed Identity
┌──────────────────▼──────────────────────────────┐
│        Azure Blob Storage (ScubaConnect)        │
│  scubagear-output / yyyy/MM/dd/ScubaResults.json│
└─────────────────────────────────────────────────┘
```

## Prerequisites

- **Azure subscription**
- **Azure CLI** (`az`) installed and logged in
- **Node.js 22+**
- **OpenAI API key** (GPT-4o)
- **Power Platform environment** (for Power Apps; Copilot Studio is optional)

## Quick Start

Two deployment paths:

### Path A — One-Click Deploy to Azure (Recommended)

1. Click the **Deploy to Azure** button above
2. Fill in the parameters:
   - **Resource group**: create new or use existing
   - **OpenAI API Key**: your GPT-4o key
   - Leave other defaults as-is
3. Click **Review + create** → **Create**
4. After deployment completes (~3 minutes), go to **Outputs** to get your Function App name and URL
5. Deploy the function code using GitHub Actions:
   - Go to the repo’s **Actions** tab → **Build & Deploy Functions** → **Run workflow**
   - Enter your Function App name
   - Or run locally: `cd azure-functions && npm ci && npm run build && func azure functionapp publish <your-func-app> --javascript`
6. **Import the Power App**: Go to [Power Apps](https://make.powerapps.com) → **Apps** → **Import canvas app** → upload the `.zip` from `power-apps/`
7. **Create the Custom Connector**: Import `azure-functions/openapi.json`, set the host and API key
8. Open the app, add the connector as a data source, and publish

For full details, see **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)**.

### Path B — PowerShell Script

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

The app accepts both ScubaGear output formats:

**TestResults format** (ScubaGear < 1.5) — flat array:

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

**ScubaResults format** (ScubaGear 1.5–1.7) — nested with product groups:

```json
{ "Results": { "AAD": [{ "GroupName": "...", "Controls": [...] }], ... } }
```

ScubaGear 1.7+ fields supported: `Omitted` status, `OmittedEvaluationResult`, `IncorrectResult`, `OriginalResult`, `Comments`, `ResolutionDate`.

## Key Features

- **Conditional Access Policy Exclusion Analysis** — For `MS.AAD.3.x` controls, the parser inspects
  `ActualValue` JSON to extract excluded users and groups from each Conditional Access policy,
  classifies policies by purpose (MFA, phishing-resistant MFA, block legacy auth, etc.), and
  generates per-control exclusion notes showing approved vs. unapproved exclusions with user/group
  counts (e.g., `⚠️ Unapproved exclusions: Enforce MFA [2 user(s), 1 group(s)]`).
- **Managed Identity Storage Auth** — Storage endpoints support both SAS token and Azure Managed
  Identity authentication. A toggle in the Power App lets users switch between modes. When
  Managed Identity is enabled, the function app uses its system-assigned identity with RBAC
  (Storage Blob Data Reader) — no SAS token needed.
- **Baseline URL Version Rewriting** — ScubaGear embeds GitHub URLs pointing to the version that
  generated the report. The parser rewrites these to the pinned baseline version (`v1.8.0`) so links
  always point to matching baseline documentation.
- **GPT-4o Compliance Chat** — Context-aware AI assistant with function-calling that can look up
  controls, fetch remediation steps, search Microsoft Learn, and analyze Rego policy logic.

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
| `/api/storage/list-blobs` | GET | List JSON blobs in a storage container |
| `/api/storage/fetch-blob` | POST | Fetch a blob from storage and parse it |
| `/api/chat` | POST | AI-powered compliance chat |

## Updating baselines
Control data in `azure-functions/src/shared/baseline-data.generated.ts` is produced from the
CISA baseline markdown at a pinned ScubaGear tag. Never edit it by hand.

```powershell
cd azure-functions
npm run baselines:generate                 # latest ScubaGear release
npm run baselines:generate -- --tag v1.8.0 # a specific tag
npm run baselines:check                    # fails if the committed data drifted
```

`baselines:check` runs automatically before every build. The
`.github/workflows/update-baselines.yml` workflow polls weekly and opens a PR with the
added / removed / re-versioned control IDs summarized in the description.

What is derived automatically:

| Field | Source |
|-------|--------|
| Requirement, rationale, notes, NIST / MITRE, resources, implementation | baseline markdown |
| `criticality` | `<!--Policy:-->` marker plus SHALL NOT / SHOULD NOT in the requirement |
| `checkType` | whether a Rego rule ships for the policy ID |
| `exclusionType` | `<!--ExclusionType:-->` marker |
| `product`, section names | the policy IDs themselves, not filenames |

Only `bod2501` and `configurable` overrides live in `baseline-overrides.json`, because CISA
does not encode them in the markdown. The generator warns when an override references a
control ID that no longer exists — that is the signal a policy was renamed or removed.

### Product renames

Products are keyed by their policy IDs and discovered from the upstream `baselines/`
directory, so a new or renamed product needs no code change. ScubaGear 2.0 splits Defender
checks into `MS.SECURITYSUITE.*`; that rename is already covered by `productAliasGroups`
in `baseline-overrides.json`, which lets results from either naming resolve to whichever
key the pinned baseline ships.

Schema changes — new exclusion types, new result statuses — are **not** covered by the
generator and still need a code review pass over `scubagear-parser.ts`.

## Redeploying updates

`deploy-functions.ps1` provisions infrastructure. Once deployed, use `update-functions.ps1`
for code-only updates — it builds, tests, publishes, smoke-tests, and writes a
connector-ready spec:

```powershell
# redeploy current code
.\update-functions.ps1 -ResourceGroupName rg-scubagear-functions

# pull the latest ScubaGear baselines, then redeploy
.\update-functions.ps1 -ResourceGroupName rg-scubagear-functions -UpdateBaselines
```

It writes `release/openapi.<app-name>.json` with the live host filled in. Paste that into
**Custom connector → Edit → Swagger Editor → Update connector** whenever endpoint
parameters change.

The canvas app needs no rebuild — its product filter is populated from the parsed results,
so new or renamed products appear on their own.

## Local Development

```powershell
cd azure-functions
npm install
npm run build

$env:OPENAI_API_KEY = "<your-key>"
func start
```

The function app runs on Node.js 22 (Flex Consumption plan in Azure).

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
