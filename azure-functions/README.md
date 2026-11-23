# ScubaGear Analyzer — Azure Functions Backend

TypeScript Azure Functions (Node.js 22, v4 programming model) that power the
ScubaGear Analyzer. These functions are consumed by the Power Apps canvas app via
a custom connector and optionally by a Copilot Studio agent.

## Architecture

```
Power Apps / Copilot Studio
        │
        ▼
 Custom Connector (APIScubaGearAnalyzer)
        │
        ▼
 Azure Functions (Flex Consumption)
  ├── parse-results        — parse uploaded ScubaGear JSON
  ├── storage/*            — browse & load from Azure Blob Storage
  ├── baseline/*           — CISA baseline control data
  ├── learn/*              — Microsoft Learn documentation
  └── chat                 — GPT-4o powered assistant
```

## Functions

### Core

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| **parse-results** | POST | `/api/parse-results` | Accepts raw ScubaGear JSON (TestResults or ScubaResults format), parses all controls, computes pass/fail summary, product breakdown, and chat context. This is the primary entry point when users paste JSON directly. |
| **chat** | POST | `/api/chat` | LLM-powered compliance assistant (OpenAI or Azure OpenAI) with function-calling. Grounded on CISA baseline data and Microsoft Learn. Accepts a user message, optional assessment context from a parsed report, and conversation history. |

### Baseline (CISA ScubaGear policy data)

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| **baseline-getControlInfo** | GET | `/api/baseline/control?controlId=MS.AAD.1.1v1` | Returns full details for a specific control: description, criticality, rationale, NIST/MITRE mappings, BOD 25-01 applicability, remediation steps, and license requirements. Includes `baselineStatus` (`current`, `versionDrift`, `removed`) and, for controls removed from the baseline, the replacement controls. |
| **baseline-getRemediation** | GET | `/api/baseline/remediation?controlId=MS.AAD.3.1v1` | Returns remediation/implementation steps, rationale, notes, license requirements, and resource links for a control. |
| **baseline-getSectionSummary** | GET | `/api/baseline/section?number=3&product=AAD` | Returns a summary of a baseline section (numbering is per product): control count, SHALL/SHOULD breakdown, automated vs manual checks, BOD 25-01 count, and the list of controls. Entra ID section 7 also returns the highly privileged roles list. |
| **baseline-listControls** | GET | `/api/baseline/controls?product=EXO&section=3` | Lists all baseline controls or filters by product and/or section number. Returns control ID, title, criticality, check type, and section info. |
| **baseline-search** | GET | `/api/baseline/search?query=MFA` | Keyword search across baseline controls. Matches against control ID, title, description, and section name. |
| **baseline-getChanges** | GET | `/api/baseline/changes?from=1.8.0&to=2.0.0&product=AAD&controlId=...&type=removed&limit=200` | What changed in the baselines between ScubaGear releases: controls added, removed, re-versioned or revised, with CISA's replacement mapping and the upstream release notes. All filters are optional. |
| **baseline-getReleases** | GET | `/api/baseline/releases?includeNotes=true` | Lists the releases covered by the change history with the "Baselines" section of each release's notes. |

### Microsoft Learn

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| **learn-search** | GET | `/api/learn/search?query=conditional+access&maxResults=5` | Searches Microsoft Learn for documentation articles. Returns titles, URLs, descriptions, and last-updated dates. Max 10 results. |
| **learn-getArticle** | GET | `/api/learn/article?url=https://learn.microsoft.com/...` | Fetches and returns the content of a specific Microsoft Learn article. Only accepts `learn.microsoft.com` URLs. |
| **learn-getControlDocs** | GET | `/api/learn/control-docs?controlId=MS.AAD.1.1v1&fetchContent=false` | Returns Microsoft Learn URLs mapped to a ScubaGear control. If no direct mapping exists, falls back to a Learn search. Set `fetchContent=true` to also return article content. |

### Storage (Azure Blob Storage)

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| **storage-listBlobs** | GET | `/api/storage/list-blobs?storageAccountName=...&containerName=...&sasToken=...&prefix=` | Lists `.json` files in an Azure Blob Storage container (e.g. ScubaConnect output). Sorted newest-first. Supports **SAS token** or **Managed Identity** auth — pass an empty `sasToken` to use MI. Optional `prefix` filter. |
| **storage-fetchBlob** | POST | `/api/storage/fetch-blob` | Downloads a specific blob from storage, parses it through the same pipeline as `parse-results`, and returns the full structured result. Body: `{ storageAccountName, containerName, sasToken, blobName }`. Pass empty `sasToken` for Managed Identity. |

## Shared Modules

| Module | Description |
|--------|-------------|
| `shared/scubagear-parser.ts` | Detects ScubaGear format (TestResults pre-1.5 vs ScubaResults 1.5+), extracts controls and the report's ScubaGear version, flags controls the pinned baseline has removed or re-versioned, computes summaries, builds chat context, rewrites baseline URLs to current version, and performs **Conditional Access Policy exclusion analysis** — classifies policies by category (MFA, phishing-resistant MFA, block legacy auth, etc.), identifies approved vs unapproved exclusions, and generates per-control notes with user/group counts. Handles Omitted, IncorrectResult, Comments, and ResolutionDate fields. |
| `shared/baseline-data.ts` | Lookup, search and filtering helpers over the generated CISA ScubaGear baseline data (`baseline-data.generated.ts`) for every product, plus the highly privileged roles list. |
| `shared/baseline-changes.ts` | Query helpers over the generated release history (`baseline-changes.generated.ts`): change lookups by version/product/control, `resolveControl` (current / re-versioned / removed), report-vs-baseline version comparison, and Markdown formatting for the chat. |
| `shared/learn-fetcher.ts` | Microsoft Learn integration — search, article fetching, and control-to-URL mapping. |
| `shared/types.ts` | TypeScript type definitions shared across functions. |

## Authentication

All functions use **function-level** auth (`authLevel: 'function'`). Requests
must include the function host key as a `code` query parameter or `x-functions-key`
header.

### Storage Authentication

The storage functions (`list-blobs`, `fetch-blob`) support two auth modes:

| Mode | How | Setup |
|------|-----|-------|
| **SAS Token** | Pass a valid SAS token in the `sasToken` parameter | Generate a SAS with `rl` (read + list) permissions on the container |
| **Managed Identity** | Pass an empty string for `sasToken` | Assign **Storage Blob Data Reader** RBAC role to the function app's system-assigned identity |

The function app's system-assigned Managed Identity is enabled automatically
by the Bicep template. See the [Deployment Guide](../DEPLOYMENT-GUIDE.md)
for RBAC setup instructions.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_PROVIDER` | No | `openai` or `azure`. Inferred as `azure` when `AZURE_OPENAI_ENDPOINT` is set, otherwise `openai`. |
| `OPENAI_API_KEY` | Yes, for `openai` | OpenAI API key. Only needed by the `chat` function. |
| `OPENAI_MODEL` | No | OpenAI model name. Defaults to `gpt-4o`. |
| `AZURE_OPENAI_ENDPOINT` | Yes, for `azure` | Azure OpenAI / AI Foundry endpoint, e.g. `https://<resource>.openai.azure.com`. |
| `AZURE_OPENAI_DEPLOYMENT` | Yes, for `azure` | Model deployment name. |
| `AZURE_OPENAI_API_VERSION` | No | Defaults to `2024-10-21`. |
| `AZURE_OPENAI_API_KEY` | No | Local development only. Without it, the function app's Managed Identity (or `az login` locally) is used. |
| `AZURE_OPENAI_TOKEN_SCOPE` | No | Override the Entra token scope. Inferred from the endpoint for commercial, `.azure.us` and `.azure.cn` clouds. |
| `SCUBAGEAR_CURRENT_VERSION` | No | Override the ScubaGear version used in baseline URLs. Defaults to the pinned baseline version in `scubagear-version.json`. |

## Local Development

```bash
cd azure-functions
npm install
npm run build
npm start          # Starts the Azure Functions local runtime on port 7071
```

Requires:
- Node.js 22+
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4+

Create a `local.settings.json` (git-ignored) with:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "OPENAI_API_KEY": "sk-..."
  }
}
```

## Deployment

See the [Deployment Guide](../DEPLOYMENT-GUIDE.md) for full instructions. Quick summary:

```powershell
# From the repo root
.\deploy-functions.ps1 -ResourceGroup <rg-name> -Location <region>
```

This deploys to an Azure Functions Flex Consumption plan with Node.js 22.

## Project Structure

```
azure-functions/
├── host.json                          # Azure Functions host config
├── local.settings.json                # Local dev settings (git-ignored)
├── openapi.json                       # OpenAPI 3.0 spec for custom connector
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript config
└── src/
    ├── functions/
    │   ├── parse-results.ts           # POST — parse ScubaGear JSON
    │   ├── chat.ts                    # POST — GPT-4o assistant
    │   ├── baseline-getControlInfo.ts # GET  — control details
    │   ├── baseline-getRemediation.ts # GET  — remediation steps
    │   ├── baseline-getSectionSummary.ts # GET — section summary
    │   ├── baseline-listControls.ts   # GET  — list/filter controls
    │   ├── baseline-search.ts         # GET  — keyword search
    │   ├── learn-search.ts            # GET  — search MS Learn
    │   ├── learn-getArticle.ts        # GET  — fetch article content
    │   ├── learn-getControlDocs.ts    # GET  — control → Learn URLs
    │   ├── storage-listBlobs.ts       # GET  — list blobs in container
    │   └── storage-fetchBlob.ts       # POST — fetch & parse blob
    └── shared/
        ├── scubagear-parser.ts        # ScubaGear format detection & parsing
        ├── baseline-data.ts           # CISA AAD baseline data
        ├── learn-fetcher.ts           # Microsoft Learn integration
        └── types.ts                   # Shared TypeScript types
```
