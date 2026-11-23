# Copilot Studio Agent Definition — ScubaGear Analyzer

> **This component is optional.** The Power Apps canvas app includes a built-in
> Chat screen that calls the Azure Functions `/api/chat` endpoint directly.
> Use Copilot Studio only if you want an additional conversational interface
> (e.g., a standalone Teams bot or embedded agent).

This folder contains the configuration and setup instructions for creating
the **ScubaGear Analyzer** agent in Microsoft Copilot Studio.

## Overview

The Copilot Studio agent wraps the Azure Functions backend and provides an
**alternative** conversational interface for security teams to:

- Analyse ScubaGear compliance results
- Look up CISA baseline control details
- Get step-by-step remediation guidance
- Search Microsoft Learn documentation
- Understand NIST/MITRE mappings

---

## Setup Instructions

### Prerequisites

1. **Azure Functions deployed** — The `azure-functions/` project must be deployed
   to Azure and accessible with a function key.
2. **Power Platform environment** — An environment with Copilot Studio access.
3. **Custom Connector** — Created from the OpenAPI spec (see below).

---

### Step 1: Create the Custom Connector

1. Go to **Power Apps** → **Custom Connectors** (or **Power Automate** → **Custom Connectors**)
2. Click **+ New custom connector** → **Import an OpenAPI file**
3. Upload `azure-functions/openapi.json`
4. Configure:
   - **Host**: `<your-function-app>.azurewebsites.net`
   - **Base URL**: `/api`
   - **Security**: API Key → Header → `x-functions-key`
5. Click **Create connector**
6. **Test** each operation to verify connectivity

---

### Step 2: Create the Copilot Studio Agent

1. Go to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com)
2. Click **Create** → **New agent**
3. Name: **ScubaGear Analyzer**
4. Description: *"CISA ScubaGear compliance assistant that helps analyse M365
   baseline assessment results and provides remediation guidance."*

---

### Step 3: Configure the System Prompt

In the agent's **Instructions** field, paste:

```
You are ScubaGear Analyzer, a CISA ScubaGear compliance assistant.

You help security teams understand, analyse, and remediate the baseline
controls defined by CISA for Microsoft 365.

You have access to these capabilities via connector actions:
1. GetControlInfo — Look up baseline control details by ID
2. ListControls — List all controls, optionally by section
3. GetRemediation — Get remediation steps for a specific control
4. SearchBaseline — Search controls by keyword
5. GetSectionSummary — Summarize a baseline section
6. SearchLearn — Search Microsoft Learn documentation
7. GetControlDocs — Get Learn docs mapped to a control
8. ParseResults — Parse uploaded ScubaGear JSON results
9. Chat — Full AI-powered analysis with tool calling
10. ListBlobs — Browse JSON files in Azure Blob Storage
11. FetchBlob — Load and parse a blob from storage
12. GetBaselineChanges — What changed in the baselines between ScubaGear releases
13. GetBaselineReleases — Release list with CISA's baseline release notes

When users mention controls in shorthand:
- "entra 3.1" or "aad 3.1" → MS.AAD.3.1v1
- "security suite 1.1" → MS.SECURITYSUITE.1.1v1
- "defender 1.4" → MS.DEFENDER.1.4v1 (a ScubaGear 1.x ID — see below)
- "exo 4.3" → MS.EXO.4.3v1

Normalize to MS.PRODUCT.SECTION.ITEMvN. The version suffix is NOT always v1 —
CISA revises individual policies (e.g. MS.AAD.3.2v2, MS.EXO.2.2v3).
Lookups tolerate a stale suffix and resolve to the current version.

Section numbers are per product, not global. Pass the product alongside a
section number.

ScubaGear 2.0 retired the Defender baseline into MS.SECURITYSUITE.* and moved
several Exchange Online and Teams policies there too. Treat DEFENDER and
SECURITYSUITE as the same product. GetControlInfo on a removed control returns
baselineStatus "removed" with the replacement controls in replacedBy.

Baseline changes:
- For "what changed in 2.0", "what's new", or "what was removed", call
  GetBaselineChanges (from = the release the user is coming from) and explain
  the practical impact, not just the IDs.
- ParseResults returns scubaGearVersion, versionNote and per-control
  baselineStatus. If the report is from an older ScubaGear than the baseline,
  say so, explain controls marked removed or versionDrift, and recommend
  re-running ScubaGear before treating results as current.

Response guidelines:
- Ground answers in baseline data and Microsoft Learn documentation
- When discussing failures: explain requirement → explain why it failed → provide remediation
- Use Markdown formatting
- Include admin portal navigation paths in remediation steps
```

---

### Step 4: Add Connector Actions as Tools

1. In Copilot Studio, go to **Tools** → **+ Add a tool**
2. Search for your **ScubaGear Analyzer** custom connector
3. Add these actions:

| Action | When to Use |
|--------|-------------|
| `GetControlInfo` | User asks about a specific control (e.g., "What is MS.AAD.3.1v1?") |
| `GetRemediation` | User asks how to fix/remediate a control |
| `SearchBaseline` | User searches by topic (e.g., "MFA controls") |
| `ListControls` | User wants to see all controls or a section |
| `GetSectionSummary` | User asks about a section (e.g., "What's in section 7?") |
| `SearchLearn` | User asks for Microsoft documentation |
| `GetControlDocs` | User wants Learn docs for a specific control |
| `ParseResults` | User uploads ScubaGear results for analysis |
| `Chat` | User asks a complex question requiring AI reasoning |
| `ListBlobs` | User wants to browse result files in Azure Blob Storage |
| `FetchBlob` | User wants to load and parse a specific blob from storage |
| `GetBaselineChanges` | User asks what changed between ScubaGear releases, what was removed, or what's new in a release |
| `GetBaselineReleases` | User wants the list of releases or CISA's baseline release notes |

4. For each tool, configure the **Input descriptions** so the agent knows
   when to call them.

---

### Step 5: Create Topics (Optional — for structured flows)

#### Topic: Analyse Results
**Trigger phrases**: "analyse my results", "parse my scubagear output", "upload results"

**Flow**:
1. Ask user to paste their JSON or provide the file content
2. Call `ParseResults` with the JSON
3. Display summary: total/pass/fail/manual counts
4. Show product breakdown
5. Ask if they want to drill into failures

#### Topic: Control Lookup
**Trigger phrases**: "what is control", "tell me about", "look up"

**Flow**:
1. Extract control ID from user message
2. Call `GetControlInfo`
3. Display control details
4. Offer "Want remediation steps?" → Call `GetRemediation`

#### Topic: Remediation Help
**Trigger phrases**: "how do I fix", "remediate", "implementation steps"

**Flow**:
1. Extract control ID
2. Call `GetRemediation` for baseline steps
3. Call `GetControlDocs` for Learn references
4. Present combined guidance

---

### Step 6: Configure Generative AI (Orchestrator)

1. In **Settings** → **Generative AI**, enable **Generative answers**
2. Set the orchestrator to use the connector actions as tools
3. This allows the agent to dynamically decide which actions to call
   based on user intent, similar to the function-calling loop in the
   original chat endpoint

---

### Step 7: Embed in Power Apps (Optional)

1. In your Power Apps canvas app, add the **Copilot** control
2. Configure it to use the ScubaGear Analyzer agent
3. The agent will appear as a chat panel alongside the dashboard

---

## Architecture Flow

```
User (Power Apps / Teams / Copilot Studio)
    ↓
Copilot Studio Agent
    ↓  (calls connector actions)
Custom Connector (APIScubaGearAnalyzer)
    ↓  (HTTP + function key)
Azure Functions (Flex Consumption / Node.js 22)
    ├── /baseline/*        — CISA baseline data (in-memory)
    ├── /learn/*           — Microsoft Learn API proxy
    ├── /parse-results     — ScubaGear JSON parser
    ├── /storage/list-blobs— Browse Azure Blob Storage
    ├── /storage/fetch-blob— Load & parse blob from storage
    └── /chat              — GPT-4o orchestration with tool calling
```

---

## Testing

1. In Copilot Studio, use the **Test** pane
2. Try these prompts:
   - "What is MS.AAD.3.1v1?"
   - "How do I fix the legacy authentication control?"
   - "Show me all section 7 controls"
   - "Search for MFA documentation on Microsoft Learn"
   - "What are the highly privileged roles?"

---

## Environment Variables (Azure Functions)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for the `/chat` endpoint (or `AI_PROVIDER=azure` with `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT` to use Azure OpenAI) |
| `ALLOWED_ORIGINS` | CORS origins (Power Apps domain) |
