/**
 * Azure Function: chat
 * 
 * POST /api/chat
 * Body: { message: string, assessmentContext?: string, history?: ChatMessage[] }
 * 
 * LLM-powered chat (OpenAI or Azure OpenAI, see shared/ai-client.ts) with function-calling.
 * Grounded on ScubaGear baseline data and Microsoft Learn documentation.
 * This is the primary endpoint consumed by the Power Apps chat screen
 * (and optionally the Copilot Studio agent).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getChatClient } from '../shared/ai-client.js';
import { getControlById, searchControls, getControlsBySection, getControlsByProduct, getSectionName, canonicalizeProduct, HIGHLY_PRIVILEGED_ROLES, SCUBAGEAR_BASELINE_VERSION } from '../shared/baseline-data.js';
import { getChanges, getControlHistory, getRelease, getReleases, resolveControl, formatChangesMarkdown, describeChange, normalizeVersion } from '../shared/baseline-changes.js';
import { searchLearn, fetchArticle, getLearnUrlsForControl, getSearchQueryForTopic } from '../shared/learn-fetcher.js';
import { SCUBAGEAR_CURRENT_VERSION, extractProduct, buildExclusionSummary } from '../shared/scubagear-parser.js';
import { buildCapAnalysis, DIAGNOSIS_INTENT_RE, extractControlReferences, extractRegoRule, FAILURE_INTENT_RE, prioritizeFailures, parseNearMisses } from '../shared/analysis.js';
import type { ExclusionContext } from '../shared/types.js';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/index';


// ── Rego policy fetching ────────────────────────────────────
// File names are case-sensitive on raw.githubusercontent.com (note `SharepointConfig`).
const REGO_FILE_MAP: Record<string, string> = {
  AAD: 'AADConfig', EXO: 'EXOConfig', SECURITYSUITE: 'SecuritySuiteConfig',
  SHAREPOINT: 'SharepointConfig', TEAMS: 'TeamsConfig',
  POWERPLATFORM: 'PowerPlatformConfig', POWERBI: 'PowerBIConfig',
};
const REGO_CACHE = new Map<string, { content: string; fetchedAt: number }>();
const REGO_CACHE_TTL = 3_600_000; // 1 hour

async function fetchRegoFile(product: string): Promise<string | null> {
  const key = product.toUpperCase();
  const fileName = REGO_FILE_MAP[key];
  if (!fileName) return null;

  const cached = REGO_CACHE.get(key);
  if (cached && Date.now() - cached.fetchedAt < REGO_CACHE_TTL) return cached.content;

  const url = `https://raw.githubusercontent.com/cisagov/ScubaGear/v${SCUBAGEAR_CURRENT_VERSION}/PowerShell/ScubaGear/Rego/${fileName}.rego`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const content = await res.text();
    REGO_CACHE.set(key, { content, fetchedAt: Date.now() });
    return content;
  } catch { return null; }
}

const MAX_REGO_EXCERPT = 6_000;

/** The Rego that evaluates a control, trimmed for the model; null when it cannot be fetched or found. */
async function getRegoExcerpt(controlId: string): Promise<string | null> {
  const product = extractProduct(controlId);
  if (!product) return null;
  const content = await fetchRegoFile(product);
  if (!content) return null;
  const rule = extractRegoRule(content, controlId);
  if (rule.startsWith('No Rego rule found')) return null;
  return rule.length > MAX_REGO_EXCERPT ? `${rule.slice(0, MAX_REGO_EXCERPT)}\n# …[truncated]` : rule;
}

// ── System prompt ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are **ScubaGear Analyzer**, a CISA ScubaGear compliance assistant.
You help security teams understand, analyse, and remediate the baseline controls defined by CISA for Microsoft 365.

You have access to exactly two back-end knowledge sources:
1. **ScubaGear Baseline** — static policy data from the official CISA ScubaGear repository (currently release v${SCUBAGEAR_BASELINE_VERSION}): control descriptions, remediation steps, NIST/MITRE mappings, and implementation guidance. It also includes the **baseline change history** across releases (controls added, removed, re-versioned or revised, with CISA's replacement mapping and release notes).
2. **Microsoft Learn** — official Microsoft documentation for Entra ID, Security Suite (Defender for Office 365 / Exchange Online Protection), Exchange Online, SharePoint, Teams, Power BI, and Power Platform configuration.

You do NOT have live access to the user's tenant. All tenant-specific data comes from the uploaded ScubaGear TestResults.json which is provided as context below.

### Control ID resolution
Users may refer to controls in shorthand:
- "entra 3.1" or "aad 3.1" → MS.AAD.3.1v1
- "security suite 1.1" or "securitysuite 1.1" → MS.SECURITYSUITE.1.1v1
- "defender 1.4" → MS.DEFENDER.1.4v1 (a v1.x ID; the Defender baseline was retired in ScubaGear 2.0 — use baseline_get_control_history to find its replacement)
- "exo 4.3" → MS.EXO.4.3v1
- "sharepoint 1.1" → MS.SHAREPOINT.1.1v1
- "teams 2.1" → MS.TEAMS.2.1v2
- "powerplatform 1.1" → MS.POWERPLATFORM.1.1v1
- "powerbi 1.1" → MS.POWERBI.1.1v1
Version suffixes change when CISA revises a control (e.g. MS.AAD.3.2v1 became MS.AAD.3.2v2), so never assume "v1". Resolve the ID with a tool when unsure, and always pass the full MS.PRODUCT.X.Xv# form to tools.

### Baseline changes
CISA updates the baselines with each ScubaGear release, and a report may come from a different release than the baseline data you hold. The assessment header states both versions.
- For questions like "what changed in 2.0?", "what's new?", "what was removed?", "what do I need to re-check after upgrading?" use **baseline_get_changes** (filter by from/to version, product, or change type). Use **baseline_get_release_notes** for CISA's own narrative of a release.
- For "what happened to control X?" or when a result references a control that is marked REMOVED or re-versioned, use **baseline_get_control_history**. It returns the control's current definition, its recorded changes, and CISA's replacement controls.
- When the report was generated by an older ScubaGear than the baseline, point out that its pass/fail results were evaluated against the older requirement: say what the requirement was then versus now, and recommend re-running ScubaGear before treating a pass as current. Never present an older requirement as the current one.
- Explain the *practical impact* of a change (new requirement to satisfy, a relaxed requirement, a control that merged into another, a control that no longer has an automated check) rather than just listing IDs. Distinguish changes that affect BOD 25-01 required controls.
- Only report changes the tools return. If the history does not cover something, say so.

### Understanding the question
Work out what each question is actually asking, then answer that. Do not force every question into one template. Common intents:
- **Failure clarification** — "why is X failing", "how do I pass check X", "how do I fix X", "what's wrong with X", "what do I need to change for X", "get X to pass". All of these deserve the same full diagnosis whatever the wording: the cause, the options and trade-offs, exact changes or commands, and how to verify. Adjust only the emphasis: for "how do I pass / fix", lead with the fix; for "why", lead with the cause.
- **Meaning, requirement, rationale, license, or how a control is checked** — answer directly and concisely from baseline data (baseline_get_control_info, baseline_get_remediation_steps). Do not turn it into a failure analysis; if the control happens to be failing, one sentence saying so is enough unless asked.
- **Status check** ("is X passing?", "what's my result for X?") — state the status and the short reason in a sentence or two, and offer the detail.
- **Comparisons or several controls at once** — use a compact table.
- **Overview or priorities** ("what should I fix first?", "summarise my failures") — prioritize_failures.
- **What changed between ScubaGear versions** — the baseline change tools.
- **Anything unclear** — if the question could mean two different things, pick the most likely reading and say which you assumed, or ask one short question.
A short follow-up such as "how do I fix it?" refers to the control just discussed. A bare number such as "check 3.1" that exists in several products is settled by the conversation; if it is not, ask which one rather than guessing.

When a question looks like failure clarification, a **pre-fetched diagnosis** is supplied as a system message before it. Treat it as data, not a template: use what is relevant to what the user asked, and if they asked something else, answer that. For other questions nothing is pre-fetched, so call the tools you need.

### Scan result analysis
When the user asks about the result or failure of a specific control, use the **analyze_scan_result** tool to get the full scan details (unless a pre-fetched diagnosis for that control is already provided). It combines the raw ScubaGear scan output with the official CISA baseline requirement and, for failing automated checks, the **Rego rule ScubaGear evaluated**. Extract specific findings: user names, group names, policy names, and settings that caused the result. For pure definition questions (what it requires, why CISA wants it, licensing) the baseline tools are enough.

Use the Rego section to name the exact condition that was not met, and summarise it in plain English. For a **near miss**, check the Rego to confirm what else a policy must satisfy besides the approved exclusions, and say so plainly if approving the exclusion alone would not make the control pass.

For Conditional Access controls (MS.AAD.3.x) the tool also returns a **policy evidence table**, any **ScubaGear near miss** (a policy that would pass if the config file approved its exclusions), a **decision** with a ready-to-paste config snippet, and an **identity cross-reference**. Use those sections as written: quote the exact policy names, states and GUIDs, keep the YAML snippet as given, and do not invent display names for GUIDs the report does not resolve.

### Prioritisation
When the user asks what to fix first, what matters most, for a summary of failures, or for a remediation plan, call **prioritize_failures** (optionally with a product) and present its tiers in order: quick wins, BOD 25-01 SHALL, other SHALL, then SHOULD. Do not rank controls yourself.

### Exclusion analysis
The user's scan data includes **exclusion configuration** from the ScubaGear config file and from Conditional Access Policies (CAPs). Use the **analyze_exclusions** tool when:
- The user asks "what exclusions do I have?", "show me my exclusions", or "list exclusions"
- The user asks about CapExclusions, AnnotatePolicy, OmitPolicy, or excluded users/groups across the whole tenant
(analyze_scan_result already includes the exclusion evidence for a single CAP control, so do not call analyze_exclusions as well when answering a question about one control.)

Exclusion types:
- **CapExclusions**: Approved user/group exclusions per control (e.g. break-glass accounts excluded from MS.AAD.3.6v1)
- **AnnotatePolicy**: Policies marked for manual review with custom notes
- **OmitPolicy**: Policies completely omitted from evaluation
- **CAP ExcludeUsers/ExcludeGroups**: Users and groups excluded within each Conditional Access Policy — these may or may not be approved

### Rego policy comparison
analyze_scan_result already includes the Rego for a failing automated control. Use **fetch_rego_policy** only when you need the rule for a different control, or the user explicitly asks to see the full rule. Compare the Rego logic against the **ActualValue** data from the scan to pinpoint exactly which condition failed, walking through the conditions that passed and the one that did not.

### Response guidelines
- **Lead with the answer to what was asked.** The first sentence gives the direct answer, for example "MS.AAD.3.1v1 fails because one enabled policy is a single exclusion away from passing."
- When explaining a failure (why it fails, how to pass or fix it) use this order, and skip any part that has nothing specific to say: **Why it fails** (the evidence: policy names, states, GUIDs, settings), **Your options** (what to change, with the trade-off), **Config / commands** (exact snippets), **How to verify** (re-run ScubaGear). Mention the baseline requirement in one short line, not a restated paragraph. Other kinds of question get a shape that fits them: short for definitions and status, a table for comparisons.
- Do not add generic advice such as "review your policies" or closing summaries. Every sentence should reference something from this tenant's scan or give a concrete action.
- When there is a security trade-off (approving an exclusion, disabling a check), state it plainly and let the user decide.
- Only state facts that appear in tool output or the uploaded assessment. If something is unknown (for example who an account GUID belongs to), say so and give the steps to find out.
- Always ground your answers in either ScubaGear Baseline data or Microsoft Learn documentation.
- Format responses in Markdown. Use headings sparingly, short bullet lists, and tables for comparisons.
- When showing remediation steps, include specific navigation paths in the Microsoft admin portals.`;

// ── Tool definitions ────────────────────────────────────────
export const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'baseline_get_control_info',
      description: 'Get detailed information about a specific CISA ScubaGear baseline control.',
      parameters: {
        type: 'object',
        properties: { controlId: { type: 'string', description: 'The control ID, e.g. MS.AAD.1.1v1' } },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_list_controls',
      description: 'List CISA ScubaGear baseline controls. Optionally filter by product (AAD, EXO, SECURITYSUITE, SHAREPOINT, TEAMS, POWERPLATFORM, POWERBI) and/or section number.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Optional product key, e.g. AAD or SECURITYSUITE. Legacy DEFENDER resolves to SECURITYSUITE.' },
          sectionNumber: { type: 'number', description: 'Optional section number within the product' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_remediation_steps',
      description: 'Get step-by-step remediation instructions for a specific control.',
      parameters: {
        type: 'object',
        properties: { controlId: { type: 'string', description: 'The control ID, e.g. MS.AAD.3.1v1' } },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_search',
      description: "Search the CISA baselines (all products) for controls matching a keyword (e.g. 'MFA', 'guest', 'DLP').",
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search term' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_section_summary',
      description: 'Get a summary of one baseline section. Section numbers are per product, so pass the product as well.',
      parameters: {
        type: 'object',
        properties: {
          sectionNumber: { type: 'number', description: 'Section number within the product' },
          product: { type: 'string', description: 'Product key, e.g. AAD, EXO, SECURITYSUITE' },
        },
        required: ['sectionNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_changes',
      description: 'List what changed in the CISA ScubaGear baselines between releases: controls added, removed, re-versioned (requirement changed) or revised, including CISA\'s replacement mapping for removed controls. Use for "what changed in 2.0", "what\'s new", "what was removed", or "what changed since the version my report used". Returns changes grouped by release transition.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Release the user is coming from, e.g. 1.8.0. Only changes published after it are returned. Omit for the full history.' },
          to: { type: 'string', description: 'Latest release to include, e.g. 2.0.0. Defaults to the current baseline.' },
          product: { type: 'string', description: 'Optional product key filter, e.g. AAD, EXO, SECURITYSUITE.' },
          type: { type: 'string', enum: ['added', 'removed', 'versioned', 'revised'], description: 'Optional filter. "versioned" = control ID version bumped because the requirement changed; "revised" = wording/guidance changed in place.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_control_history',
      description: 'Get the lifecycle of one control: whether it is current, re-versioned or removed in the pinned baseline, every recorded change across releases, and the controls that replaced it. Use when a result references a control that was removed or re-versioned, or the user asks what happened to a control.',
      parameters: {
        type: 'object',
        properties: { controlId: { type: 'string', description: 'The control ID, e.g. MS.DEFENDER.1.1v1 or MS.AAD.3.2v1' } },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_release_notes',
      description: 'Get CISA\'s own "Baselines" release notes for a ScubaGear release (additions, removals, updates, and BOD 25-01 impact). Omit the version to list the available releases.',
      parameters: {
        type: 'object',
        properties: { version: { type: 'string', description: 'Release version, e.g. 2.0.0' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_highly_privileged_roles',
      description: 'Get the list of roles CISA considers highly privileged.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_search',
      description: 'Search Microsoft Learn for documentation articles.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Max results (default 5, max 10)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_get_control_docs',
      description: 'Get Microsoft Learn docs mapped to a ScubaGear control.',
      parameters: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'Control ID' },
          fetchContent: { type: 'boolean', description: 'Fetch full content (default false)' },
        },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_get_article_content',
      description: 'Fetch the content of a specific Microsoft Learn article.',
      parameters: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Full Learn article URL' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_get_implementation_guide',
      description: 'Get a comprehensive implementation guide for a ScubaGear control from Learn docs.',
      parameters: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'Control ID' },
          topic: { type: 'string', description: 'Additional topic context' },
        },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_search_entra_topic',
      description: 'Search Microsoft Learn for Entra ID-specific documentation on a topic.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to search for' },
          maxResults: { type: 'number', description: 'Max results (default 5, max 10)' },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_scan_result',
      description: 'Analyse the actual ScubaGear scan result for a specific control. Combines the raw report details from the scan with the CISA baseline requirement to explain WHY the control passed/failed and extracts specific findings (users, groups, policies, settings). Use this when the user asks about a specific control result.',
      parameters: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'The control ID, e.g. MS.AAD.3.1v1' },
        },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_rego_policy',
      description: 'Fetch the OPA Rego policy rule that ScubaGear uses to evaluate a specific control. Returns the Rego rule logic so you can compare it against the ActualValue JSON to determine the exact reason for failure. Use AFTER analyze_scan_result for deep root-cause analysis.',
      parameters: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'The control ID, e.g. MS.AAD.3.1v1' },
        },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prioritize_failures',
      description: 'Rank every failing control in the uploaded assessment so the user knows what to fix first: quick wins (ScubaGear near misses that need only a config change), BOD 25-01 SHALL controls, other SHALL controls, then SHOULD, plus errored checks, manual items and controls from an older ScubaGear release. Use for "what should I fix first", "summarize my failures", "give me a remediation plan", or "what are my biggest risks".',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Optional product key to focus on, e.g. AAD, EXO, SECURITYSUITE.' },
          limitPerTier: { type: 'number', description: 'Max controls listed per tier (default 15).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_exclusions',
      description: 'Analyse all exclusion data from the ScubaGear scan: approved CapExclusions per control, AnnotatePolicy/OmitPolicy configs, Conditional Access Policy ExcludeUsers/ExcludeGroups, and cross-referenced analysis showing which CAP exclusions are approved vs unapproved. Use when the user asks about exclusions, or when analysing CAP-related control failures to identify if unapproved exclusions are causing failures.',
      parameters: {
        type: 'object',
        properties: {
          controlId: {
            type: 'string',
            description: 'Optional: filter exclusion analysis to a specific control ID (e.g. MS.AAD.3.6v1). If omitted, returns all exclusion data.',
          },
        },
        required: [],
      },
    },
  },
];

// ── Shared state for current request's control details ──────
let _currentControlDetails: Record<string, { status: string; reportDetails: string; actualValue?: string }> = {};
let _currentExclusionContext: ExclusionContext | null = null;

/** Replaces the per-request scan data the tools read. Used by tests; the chat handler sets it per request. */
export function setScanState(details: typeof _currentControlDetails, exclusions: ExclusionContext | null): void {
  _currentControlDetails = details;
  _currentExclusionContext = exclusions;
}

// ── Tool dispatcher (calls local functions instead of MCP) ──
export async function dispatchToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'baseline_get_control_info': {
        const control = getControlById(args.controlId as string);
        if (!control) {
          const r = resolveControl(args.controlId as string);
          if (r.status === 'removed') {
            return `${r.note}\n\n${JSON.stringify(r.legacy ?? r.removedPolicy ?? {}, null, 2)}\n\nReplacement controls:\n${r.replacements.map((c) => `- **${c.id}** [${c.criticality}] ${c.title}`).join('\n') || '(none)'}`;
          }
          return `Control '${args.controlId}' not found.`;
        }
        const r = resolveControl(args.controlId as string);
        return (r.note ? `${r.note}\n\n` : '') + JSON.stringify(control, null, 2);
      }
      case 'baseline_list_controls': {
        const sectionNumber = args.sectionNumber as number | undefined;
        const lProduct = args.product as string | undefined;
        const controls = sectionNumber
          ? getControlsBySection(sectionNumber, lProduct)
          : lProduct
            ? getControlsByProduct(lProduct)
            : (await import('../shared/baseline-data.js')).ALL_BASELINE_CONTROLS;
        if (controls.length === 0) return 'No controls match that product/section.';
        return controls.map((c) => `- **${c.id}** [${c.criticality}] ${c.title}`).join('\n');
      }
      case 'baseline_get_remediation_steps': {
        const control = getControlById(args.controlId as string);
        if (!control) {
          const r = resolveControl(args.controlId as string);
          return r.status === 'removed'
            ? `${r.note}\nUse baseline_get_remediation_steps on the replacement control(s) instead.`
            : `Control '${args.controlId}' not found.`;
        }
        return `# Remediation for ${control.id}\n\n**${control.title}**\n\n## Why This Matters\n${control.rationale}\n\n## Implementation Steps\n${control.implementation}\n\n## License Requirements\n${control.licenseRequirements}\n\n## Resources\n${control.resources.map((r) => `- ${r}`).join('\n')}`;
      }
      case 'baseline_search': {
        const results = searchControls(args.query as string);
        if (results.length === 0) return `No controls found matching '${args.query}'.`;
        return results.map((c) => `### ${c.id} [${c.criticality}]\n**${c.title}**\n${c.description}`).join('\n\n');
      }
      case 'baseline_get_section_summary': {
        const sn = args.sectionNumber as number;
        const sProduct = args.product as string | undefined;
        const sName = getSectionName(sn, sProduct);
        if (!sName) return 'Invalid section number.';
        const ctrls = getControlsBySection(sn, sProduct);
        let text = `# Section ${sn}: ${sName}\n\nTotal: ${ctrls.length} controls\n\n`;
        for (const c of ctrls) {
          text += `- **${c.id}** [${c.criticality}] ${c.title} (${c.checkType})\n`;
        }
        if (sn === 7 && sProduct && canonicalizeProduct(sProduct) === 'AAD') {
          text += `\nHighly Privileged Roles: ${HIGHLY_PRIVILEGED_ROLES.join(', ')}`;
        }
        return text;
      }
      case 'baseline_get_changes': {
        const from = args.from ? normalizeVersion(args.from as string) : null;
        const to = args.to ? normalizeVersion(args.to as string) : null;
        if (args.from && !from) return `Invalid from version '${args.from}'. Use e.g. 1.8.0.`;
        if (args.to && !to) return `Invalid to version '${args.to}'. Use e.g. 2.0.0.`;
        const types = args.type ? [args.type as 'added' | 'removed' | 'versioned' | 'revised'] : undefined;
        const changes = getChanges({ from: from ?? undefined, to: to ?? undefined, product: args.product as string | undefined, types });
        const header = `Baseline data is ScubaGear v${SCUBAGEAR_BASELINE_VERSION}. Releases covered: ${getReleases().map((r) => r.version).join(', ')}.\n\n`;
        const body = formatChangesMarkdown(changes);
        const MAX_CHARS = 30_000;
        return header + (body.length > MAX_CHARS
          ? `${body.slice(0, MAX_CHARS)}\n\n[Truncated — call again with a narrower from/to range, product, or type.]`
          : body);
      }
      case 'baseline_get_control_history': {
        const { resolution, timeline } = getControlHistory(args.controlId as string);
        let out = `# History of ${args.controlId}\n\n**Status in baseline v${SCUBAGEAR_BASELINE_VERSION}:** ${resolution.status}\n`;
        if (resolution.note) out += `${resolution.note}\n`;
        if (resolution.control) {
          out += `\n## Current definition: ${resolution.control.id} [${resolution.control.criticality}]\n${resolution.control.title}\n`;
        }
        if (resolution.replacements.length > 0) {
          out += `\n## Replacement controls\n${resolution.replacements.map((c) => `- **${c.id}** [${c.criticality}] ${c.title}`).join('\n')}\n`;
        }
        out += timeline.length > 0
          ? `\n## Recorded changes\n${timeline.map((c) => `- ${describeChange(c)}`).join('\n')}`
          : '\n_No recorded changes for this control across the covered releases._';
        return out;
      }
      case 'baseline_get_release_notes': {
        if (!args.version) {
          return `Available releases:\n${getReleases().map((r) => `- ${r.version} (${r.publishedAt.slice(0, 10)}) ${r.url}`).join('\n')}`;
        }
        const release = getRelease(args.version as string);
        if (!release) return `No release notes for '${args.version}'. Available: ${getReleases().map((r) => r.version).join(', ')}.`;
        return `# ScubaGear ${release.version} — baseline changes\nPublished ${release.publishedAt.slice(0, 10)} — ${release.url}\n\n${release.baselineNotes || '_The release notes have no baseline section._'}`;
      }
      case 'baseline_get_highly_privileged_roles':
        return `CISA Highly Privileged Roles:\n${HIGHLY_PRIVILEGED_ROLES.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

      case 'learn_search': {
        const learnResults = await searchLearn(args.query as string, (args.maxResults as number) || 5);
        if (learnResults.length === 0) return `No Learn articles found for: "${args.query}"`;
        return learnResults.map((r, i) => `${i + 1}. **${r.title}**\n${r.description}\nURL: ${r.url}`).join('\n\n');
      }
      case 'learn_get_control_docs': {
        const urls = getLearnUrlsForControl(args.controlId as string);
        if (urls.length === 0) return `No mapped docs for ${args.controlId}. Try learn_search.`;
        if (args.fetchContent) {
          const articles = await Promise.all(urls.map((u) => fetchArticle(u)));
          return articles.filter(Boolean).map((a) => `## ${a!.title}\n${a!.content}`).join('\n\n---\n\n');
        }
        return `Documentation for ${args.controlId}:\n${urls.map((u) => `- ${u}`).join('\n')}`;
      }
      case 'learn_get_article_content': {
        const article = await fetchArticle(args.url as string);
        if (!article) return `Could not fetch article at: ${args.url}`;
        return `# ${article.title}\n\n${article.content}`;
      }
      case 'learn_get_implementation_guide': {
        const urls = getLearnUrlsForControl(args.controlId as string);
        let output = `# Implementation Guide: ${args.controlId}\n\n`;
        if (urls.length > 0) {
          const primary = await fetchArticle(urls[0]);
          if (primary) output += `## ${primary.title}\n${primary.content}\n\n`;
          if (urls.length > 1) output += `Additional: ${urls.slice(1).join(', ')}\n\n`;
        }
        if (args.topic) {
          const sr = await searchLearn(getSearchQueryForTopic(args.topic as string), 3);
          if (sr.length > 0) output += `## Related: "${args.topic}"\n${sr.map((r) => `- [${r.title}](${r.url})`).join('\n')}`;
        }
        return output;
      }
      case 'learn_search_entra_topic': {
        const optimized = getSearchQueryForTopic(args.topic as string);
        const results = await searchLearn(optimized, (args.maxResults as number) || 5);
        if (results.length === 0) return `No Entra ID docs found for: "${args.topic}"`;
        return results.map((r, i) => `${i + 1}. **${r.title}**\n${r.description}\nURL: ${r.url}`).join('\n\n');
      }
      case 'analyze_scan_result': {
        const controlId = args.controlId as string;
        const baseline = getControlById(controlId);
        // Tolerate a stale version suffix: a report from an older ScubaGear keys the control by its old ID.
        const stem = (id: string) => id.replace(/v\d+$/i, '').toLowerCase();
        const scanKey = _currentControlDetails[controlId]
          ? controlId
          : Object.keys(_currentControlDetails).find((k) => stem(k) === stem(controlId));
        const scanData = scanKey ? _currentControlDetails[scanKey] : undefined;

        let output = '';

        // Older reports may reference controls the baseline has since changed or removed
        const resolution = resolveControl(controlId);
        if (resolution.status !== 'current') {
          output += `## ⚠️ Baseline version note\n${resolution.note}\n`;
          if (resolution.replacements.length > 0) {
            output += `Replacement controls:\n${resolution.replacements.map((c) => `- **${c.id}** [${c.criticality}] ${c.title}`).join('\n')}\n`;
          }
          const history = getChanges({ controlId }).slice(0, 6);
          if (history.length > 0) {
            output += `\nRecorded changes:\n${history.map((c) => `- ${describeChange(c)}`).join('\n')}\n`;
          }
          output += '\n';
        }
        if (baseline) {
          output += `## CISA Baseline Requirement: ${baseline.id}\n`;
          output += `**Section:** ${baseline.sectionNumber}. ${baseline.section}\n`;
          output += `**Title:** ${baseline.title}\n`;
          output += `**Criticality:** ${baseline.criticality}\n`;
          output += `**Check Type:** ${baseline.checkType}\n`;
          output += `**Description:** ${baseline.description}\n`;
          output += `**Rationale:** ${baseline.rationale}\n`;
          output += `**Implementation guidance:**\n${baseline.implementation}\n`;
          if (baseline.notes.length > 0) output += `**Notes:** ${baseline.notes.join('; ')}\n`;
          output += `**NIST:** ${baseline.nistMapping.join(', ')}\n`;
          output += `**MITRE:** ${baseline.mitreMapping.join(', ')}\n`;
        } else {
          output += `Control ${controlId} — no baseline definition found.\n`;
        }

        output += '\n---\n\n';

        // Scan result context
        if (scanData) {
          output += `## Scan Result\n`;
          output += `**Status:** ${scanData.status}\n`;
          output += `**Report Details:**\n${scanData.reportDetails}\n`;

          if (scanData.actualValue) {
            output += `\n## Actual Configuration Value (JSON evaluated by Rego)\n`;
            output += '```json\n' + scanData.actualValue + '\n```\n';
          } else {
            output += `\n_No ActualValue data available. Use fetch_rego_policy for Rego rule analysis based on report details._\n`;
          }
        } else {
          output += `No scan data available for ${controlId}. The user may not have uploaded results, or this control was not in the scan.\n`;
        }

        // Auto-include exclusion analysis for AAD section 3 (CAP) controls
        if (_currentExclusionContext && /^MS\.AAD\.3\.\d+v\d+$/i.test(controlId)) {
          output += '\n---\n\n## Exclusion Analysis (auto-included for CAP controls)\n\n';
          const approved = _currentExclusionContext.approvedExclusions.find(
            (e) => e.controlId === controlId
          );
          if (approved && approved.capExclusions) {
            output += `### Approved Exclusions (from scuba_config)\n`;
            if (approved.capExclusions.users.length > 0) output += `- **Users:** ${approved.capExclusions.users.join(', ')}\n`;
            if (approved.capExclusions.groups.length > 0) output += `- **Groups:** ${approved.capExclusions.groups.join(', ')}\n`;
            output += '\n';
          } else {
            output += `No approved exclusions configured for ${controlId}.\n\n`;
          }

          // Policy evidence, near-miss decision, config snippet and identity cross-reference
          const capAnalysis = buildCapAnalysis(controlId, _currentExclusionContext, _currentControlDetails);
          if (capAnalysis) output += `${capAnalysis}\n`;

          const annotated = _currentExclusionContext.annotatedPolicies.find(
            (a) => a.controlId === controlId
          );
          if (annotated) {
            output += `\n### AnnotatePolicy\nThis control has been annotated: "${annotated.comment}" (incorrectResult: ${annotated.incorrectResult})\n`;
          }

          const omitted = _currentExclusionContext.omittedPolicies.find(
            (o) => o.controlId === controlId
          );
          if (omitted) {
            output += `\n### OmitPolicy\n⏭️ This control has been **omitted** from evaluation.\nRationale: ${omitted.rationale}\nExpiration: ${omitted.expiration}\n`;
          }
        }

        // For failing automated checks, show the logic ScubaGear actually evaluated so the cause is
        // confirmed rather than inferred (this matters most for near misses).
        if (scanData && /^(fail|warning)$/i.test(scanData.status) && baseline?.checkType === 'Automated') {
          const rego = await getRegoExcerpt(baseline.id);
          if (rego) {
            const nearMiss = parseNearMisses(scanData.reportDetails).length > 0;
            output += '\n---\n\n## Rego ScubaGear evaluated\n';
            output += nearMiss
              ? 'ScubaGear reported a near miss. Use this rule to confirm what a policy must satisfy besides the approved exclusions, and say so if approving the exclusion alone would not make the control pass.\n'
              : 'Use this rule to name the exact condition that was not met. Summarise it in plain English; do not paste it unless the user asks.\n';
            output += `\`\`\`rego\n${rego}\n\`\`\`\n`;
          }
        }

        return output;
      }
      case 'prioritize_failures': {
        if (Object.keys(_currentControlDetails).length === 0) {
          return 'No assessment data available. The user has not uploaded ScubaGear results.';
        }
        return prioritizeFailures(_currentControlDetails, {
          product: args.product as string | undefined,
          limitPerTier: args.limitPerTier as number | undefined,
        });
      }
      case 'analyze_exclusions': {
        if (!_currentExclusionContext) {
          return 'No exclusion data available. The user may not have uploaded ScubaGear results, or the results did not contain a Raw section with exclusion configuration.';
        }

        const filterControlId = args.controlId as string | undefined;
        let output = '';

        if (filterControlId) {
          // Filtered view for a specific control
          output += `## Exclusion Analysis for ${filterControlId}\n\n`;

          // Approved exclusions for this control
          const approved = _currentExclusionContext.approvedExclusions.find(
            (e) => e.controlId === filterControlId
          );
          if (approved && approved.capExclusions) {
            output += `### Approved Exclusions (from scuba_config)\n`;
            if (approved.capExclusions.users.length > 0) output += `- **Users:** ${approved.capExclusions.users.join(', ')}\n`;
            if (approved.capExclusions.groups.length > 0) output += `- **Groups:** ${approved.capExclusions.groups.join(', ')}\n`;
            output += '\n';
          } else {
            output += `No approved exclusions configured for ${filterControlId}.\n\n`;
          }

          // CAP exclusion analysis (all CAPs — the cross-reference is global, not per-control)
          const capAnalysis = _currentExclusionContext.exclusionAnalysis;
          const capsWithExclusions = capAnalysis.filter(
            (a) => a.excludedUsers.length > 0 || a.excludedGroups.length > 0
          );
          if (capsWithExclusions.length > 0) {
            output += `### Conditional Access Policy Exclusion Analysis\n`;
            for (const analysis of capsWithExclusions) {
              const approvedUsers = analysis.excludedUsers.filter((u) => u.approved);
              const unapprovedUsers = analysis.excludedUsers.filter((u) => !u.approved);
              const approvedGroups = analysis.excludedGroups.filter((g) => g.approved);
              const unapprovedGroups = analysis.excludedGroups.filter((g) => !g.approved);

              output += `\n**Policy:** ${analysis.policyName} (State: ${analysis.policyState})\n`;
              if (approvedUsers.length > 0)
                output += `- ✅ Approved excluded users: ${approvedUsers.map((u) => u.displayName).join(', ')}\n`;
              if (unapprovedUsers.length > 0)
                output += `- ⚠️ **Unapproved excluded users:** ${unapprovedUsers.map((u) => u.displayName || u.id).join(', ')}\n`;
              if (approvedGroups.length > 0)
                output += `- ✅ Approved excluded groups: ${approvedGroups.map((g) => g.id).join(', ')}\n`;
              if (unapprovedGroups.length > 0)
                output += `- ⚠️ **Unapproved excluded groups:** ${unapprovedGroups.map((g) => g.id).join(', ')}\n`;
              if (unapprovedUsers.length === 0 && unapprovedGroups.length === 0)
                output += `- ✅ All exclusions are approved\n`;
            }
          }

          // Check AnnotatePolicy
          const annotated = _currentExclusionContext.annotatedPolicies.find(
            (a) => a.controlId === filterControlId
          );
          if (annotated) {
            output += `\n### AnnotatePolicy\nThis control has been annotated: "${annotated.comment}" (incorrectResult: ${annotated.incorrectResult})\n`;
          }

          // Check OmitPolicy
          const omitted = _currentExclusionContext.omittedPolicies.find(
            (o) => o.controlId === filterControlId
          );
          if (omitted) {
            output += `\n### OmitPolicy\n⏭️ This control has been **omitted** from evaluation via OmitPolicy config.\n`;
            output += `Rationale: ${omitted.rationale}\nExpiration: ${omitted.expiration}\n`;
          }
        } else {
          // Full summary
          output = buildExclusionSummary(_currentExclusionContext);
        }

        return output;
      }
      case 'fetch_rego_policy': {
        const controlId = args.controlId as string;
        const product = extractProduct(controlId);
        if (!product) return `Cannot determine product from control ID: ${controlId}`;

        const resolution = resolveControl(controlId);
        if (resolution.status === 'removed') {
          return `${resolution.note}\nThere is no Rego rule for it in ScubaGear v${SCUBAGEAR_CURRENT_VERSION}; fetch the rule for the replacement control(s) instead.`;
        }
        const effectiveId = resolution.control?.id ?? controlId;

        const regoContent = await fetchRegoFile(product);
        if (!regoContent) {
          return `Could not fetch Rego policy file for ${product}. The file may not exist at the expected URL for ScubaGear v${SCUBAGEAR_CURRENT_VERSION}.`;
        }

        const ruleExtract = extractRegoRule(regoContent, effectiveId);
        return `## Rego Policy for ${effectiveId}\n\nSource: https://github.com/cisagov/ScubaGear/blob/v${SCUBAGEAR_CURRENT_VERSION}/PowerShell/ScubaGear/Rego/${REGO_FILE_MAP[product]}.rego\n\n\`\`\`rego\n${ruleExtract}\n\`\`\`\n\nCompare this Rego logic against the ActualValue JSON from analyze_scan_result to identify which specific condition caused the control to fail.`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Error calling ${name}: ${err.message}`;
  }
}

// ── Constants ───────────────────────────────────────────────
const MAX_PREFETCH_CHARS = 40_000;

/**
 * For questions that look like failure clarification (why is it failing, how do I pass or fix it),
 * runs the diagnosis tools up front so the answer does not depend on the model choosing the right
 * tool. Other questions (meaning, licensing, status, comparisons, baseline changes) get nothing
 * pre-fetched, so the model answers what was actually asked. Returns an empty string for those.
 */
export async function buildPrefetch(
  message: string,
  history: Array<{ role: string; content: string }> | null,
): Promise<string> {
  const scans = _currentControlDetails;
  if (Object.keys(scans).length === 0) return '';
  if (!DIAGNOSIS_INTENT_RE.test(message) && !FAILURE_INTENT_RE.test(message)) return '';

  let refs = extractControlReferences(message, scans);

  // A bare number ("check 3.1") that matches several products is settled by what was discussed
  // recently; if the conversation does not settle it, the candidates are listed so the user can pick.
  if (refs.candidates.length > 0 && history?.length) {
    for (const m of [...history.slice(-6)].reverse()) {
      const mentioned = extractControlReferences(m.content ?? '', scans).ids.map((id) => extractProduct(id));
      const pick = refs.candidates.filter((c) => mentioned.includes(extractProduct(c)));
      if (pick.length === 1) {
        refs = { ids: [pick[0]], candidates: [] };
        break;
      }
    }
  }

  // Follow-ups such as "how do I fix it?" refer to whatever was discussed last.
  if (refs.ids.length === 0 && refs.candidates.length === 0 && history?.length && message.length < 200 && /\b(it|this|that|those|them|same)\b/i.test(message)) {
    for (const m of [...history.slice(-4)].reverse()) {
      const found = extractControlReferences(m.content ?? '', scans);
      if (found.ids.length > 0) {
        refs = found;
        break;
      }
    }
  }

  const sections: string[] = [];
  for (const id of refs.ids) sections.push(await dispatchToolCall('analyze_scan_result', { controlId: id }));
  if (refs.candidates.length > 0) {
    const list = refs.candidates.map((id) => {
      const b = getControlById(id);
      return `- **${id}** [${scans[id]?.status ?? 'not in report'}] ${b?.title ?? ''}`.trim();
    });
    sections.push(
      `## Which control?\nThe question gave only a number, and it matches failing controls in more than one product:\n${list.join('\n')}\n` +
        'Ask the user which one they mean in one short question that lists these. If they asked about all of them, answer each briefly.',
    );
  }
  if (refs.ids.length === 0 && refs.candidates.length === 0 && FAILURE_INTENT_RE.test(message)) {
    sections.push(prioritizeFailures(scans, { limitPerTier: 8 }));
  }
  if (sections.length === 0) return '';

  const text =
    'Diagnosis pre-fetched because this question looks like failure clarification (the same output analyze_scan_result / prioritize_failures returns). ' +
    'It is data, not a template: use what is relevant to what the user actually asked, and if they asked something else, answer that instead. ' +
    `Call tools for anything missing.\n\n${sections.join('\n\n=====\n\n')}`;
  return text.length > MAX_PREFETCH_CHARS ? `${text.slice(0, MAX_PREFETCH_CHARS)}\n\n[Truncated]` : text;
}
const MAX_TOOL_ROUNDS = 6;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 100_000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 60_000;

app.http('chat', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'chat',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = (await request.json()) as {
        message?: string;
        assessmentContext?: string;
        history?: Array<{ role: string; content: string }>;
        controlDetails?: Array<{ controlId: string; status: string; reportDetails: string; actualValue?: string }>;
      };

      const { message, assessmentContext, history, controlDetails } = body;
      const rawExclusionContext = (body as any).exclusionContext;

      // Populate exclusion context for the analyze_exclusions tool
      // Support both object (direct) and string (JSON-serialized from Power Apps) formats
      if (rawExclusionContext && typeof rawExclusionContext === 'string') {
        try {
          _currentExclusionContext = JSON.parse(rawExclusionContext) as ExclusionContext;
        } catch {
          _currentExclusionContext = null;
        }
      } else if (rawExclusionContext && typeof rawExclusionContext === 'object') {
        _currentExclusionContext = rawExclusionContext as ExclusionContext;
      } else {
        _currentExclusionContext = null;
      }

      // Populate control details map for the analyze_scan_result tool
      // Support array, JSON string, or object-with-numeric-keys from Power Apps
      _currentControlDetails = {};
      let cdArray: Array<{ controlId: string; status: string; reportDetails: string; actualValue?: string }> | null = null;
      const rawControlDetails = (body as any).controlDetails;
      if (Array.isArray(rawControlDetails)) {
        cdArray = rawControlDetails;
      } else if (typeof rawControlDetails === 'string' && rawControlDetails.trim()) {
        try { cdArray = JSON.parse(rawControlDetails); } catch { /* ignore */ }
      } else if (rawControlDetails && typeof rawControlDetails === 'object') {
        // Power Apps may send tables as { "0": {...}, "1": {...} }
        cdArray = Object.values(rawControlDetails) as any;
      }
      if (Array.isArray(cdArray)) {
        for (const cd of cdArray) {
          if (cd && cd.controlId) {
            _currentControlDetails[cd.controlId] = {
              status: cd.status || 'Unknown',
              reportDetails: (cd.reportDetails || '').slice(0, 6000),
              actualValue: cd.actualValue ? cd.actualValue.slice(0, 8000) : undefined,
            };
          }
        }
      }

      // Fallback: if controlDetails was empty/missing, extract minimal data from assessmentContext
      if (Object.keys(_currentControlDetails).length === 0 && typeof assessmentContext === 'string' && assessmentContext.length > 0) {
        const ctrlPattern = /\*\*([A-Z]+\.[A-Z]+\.\d+\.\d+v\d+)\*\*\s*\[([^\]]+)\]\s*—\s*(\S+)/g;
        let match: RegExpExecArray | null;
        while ((match = ctrlPattern.exec(assessmentContext)) !== null) {
          const [, cid, , cstatus] = match;
          if (cid && !_currentControlDetails[cid]) {
            // Grab report details: lines indented under this control (next line starting with spaces)
            const afterMatch = assessmentContext.slice(match.index + match[0].length);
            const detailMatch = afterMatch.match(/\n\s{2,3}([^\n]+)/);
            _currentControlDetails[cid] = {
              status: cstatus,
              reportDetails: detailMatch ? detailMatch[1].trim() : '',
            };
          }
        }
        context.log(`controlDetails fallback: extracted ${Object.keys(_currentControlDetails).length} controls from assessmentContext`);
      } else {
        context.log(`controlDetails: received ${Object.keys(_currentControlDetails).length} controls from request body`);
      }

      if (!message || typeof message !== 'string') {
        return { status: 400, jsonBody: { error: 'message field is required' } };
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        return { status: 400, jsonBody: { error: `Message too long. Max ${MAX_MESSAGE_LENGTH} chars.` } };
      }

      const safeContext = typeof assessmentContext === 'string'
        ? assessmentContext.slice(0, MAX_CONTEXT_LENGTH)
        : undefined;

      // Build conversation
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      if (safeContext) {
        messages.push({
          role: 'system',
          content: `The user has uploaded their ScubaGear assessment results:\n\n${safeContext}`,
        });
      } else {
        messages.push({
          role: 'system',
          content: 'No ScubaGear assessment uploaded yet. Answer general baseline questions.',
        });
      }

      // Inject history — support array, JSON string, or object-with-numeric-keys from Power Apps
      let historyArray: Array<{ role: string; content: string }> | null = null;
      const rawHistory = (body as any).history;
      if (Array.isArray(rawHistory)) {
        historyArray = rawHistory;
      } else if (typeof rawHistory === 'string' && rawHistory.trim()) {
        try { historyArray = JSON.parse(rawHistory); } catch { /* ignore */ }
      } else if (rawHistory && typeof rawHistory === 'object') {
        historyArray = Object.values(rawHistory) as any;
      }
      if (Array.isArray(historyArray) && historyArray.length > 0) {
        const trimmed = historyArray.slice(-MAX_HISTORY_MESSAGES);
        let charBudget = MAX_HISTORY_CHARS;
        for (const msg of trimmed) {
          if (msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')) {
            const text = msg.content.slice(0, 4000);
            if (charBudget - text.length < 0) break;
            charBudget -= text.length;
            messages.push({ role: msg.role, content: text });
          }
        }
        context.log(`Chat history: injected ${trimmed.length} messages`);
      }

      // Run the diagnosis for the controls (or failures) the question is about, whatever its wording.
      const prefetch = await buildPrefetch(message, Array.isArray(historyArray) ? historyArray : null);
      if (prefetch) {
        messages.push({ role: 'system', content: prefetch });
        context.log(`Pre-fetched diagnosis (${prefetch.length} chars)`);
      }

      messages.push({ role: 'user', content: message });
      const { client: ai, model } = getChatClient();
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const completion = await ai.chat.completions.create({
          model,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.2,
        });

        const choice = completion.choices[0];
        const assistantMessage = choice.message;
        messages.push(assistantMessage);

        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          return {
            status: 200,
            jsonBody: {
              response: assistantMessage.content || 'No response generated.',
              timestamp: new Date().toISOString(),
            },
          };
        }

        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (toolCall) => {
            if (toolCall.type !== 'function') {
              return { role: 'tool' as const, tool_call_id: toolCall.id, content: 'Unsupported tool type' };
            }
            const args = JSON.parse(toolCall.function.arguments);
            const result = await dispatchToolCall(toolCall.function.name, args);
            return { role: 'tool' as const, tool_call_id: toolCall.id, content: result };
          })
        );

        messages.push(...toolResults);
      }

      // Exhausted loop
      messages.push({ role: 'user', content: 'Provide your best answer with the information gathered.' });
      const finalCompletion = await ai.chat.completions.create({
        model,
        messages,
        temperature: 0.2,
      });

      return {
        status: 200,
        jsonBody: {
          response: finalCompletion.choices[0].message.content || 'No response generated.',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      context.error('Chat function error:', error);
      return {
        status: 500,
        jsonBody: { error: error.message, response: `Error: ${error.message}` },
      };
    }
  },
});
