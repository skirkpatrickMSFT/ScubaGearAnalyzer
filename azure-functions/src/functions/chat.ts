/**
 * Azure Function: chat
 * 
 * POST /api/chat
 * Body: { message: string, assessmentContext?: string, history?: ChatMessage[] }
 * 
 * LLM-powered chat using OpenAI GPT-4o with function-calling.
 * Grounded on ScubaGear baseline data and Microsoft Learn documentation.
 * This is the primary endpoint consumed by the Power Apps chat screen
 * (and optionally the Copilot Studio agent).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import OpenAI from 'openai';
import { getControlById, searchControls, getControlsBySection, getControlsByProduct, getSectionName, canonicalizeProduct, HIGHLY_PRIVILEGED_ROLES, SCUBAGEAR_BASELINE_VERSION } from '../shared/baseline-data.js';
import { getChanges, getControlHistory, getRelease, getReleases, resolveControl, formatChangesMarkdown, describeChange, normalizeVersion } from '../shared/baseline-changes.js';
import { searchLearn, fetchArticle, getLearnUrlsForControl, getSearchQueryForTopic } from '../shared/learn-fetcher.js';
import { SCUBAGEAR_CURRENT_VERSION, extractProduct, buildExclusionSummary } from '../shared/scubagear-parser.js';
import type { ExclusionContext } from '../shared/types.js';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/index';

// ── OpenAI client ───────────────────────────────────────────
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

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

/**
 * Extract the Rego rule for a specific control plus its helper
 * definitions and the file header (package / imports).
 */
function extractRegoRule(regoContent: string, controlId: string): string {
  const lines = regoContent.split('\n');

  // Header: package + imports
  const headerLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('package ') || line.startsWith('import ') || line.trim() === '') {
      headerLines.push(line);
    } else break;
  }

  // Locate the PolicyId
  const policyIdx = lines.findIndex(l => l.includes(`"${controlId}"`));
  if (policyIdx === -1) return `No Rego rule found for ${controlId} in the policy file.`;

  // Walk backwards to find rule start ("tests contains" or "tests [")
  let ruleStart = policyIdx;
  for (let i = policyIdx - 1; i >= 0; i--) {
    if (lines[i].trim().match(/^tests\s/)) { ruleStart = i; break; }
  }

  // Brace-match to find the end of the rule
  let depth = 0, started = false, ruleEnd = policyIdx;
  for (let i = ruleStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; started = true; }
      if (ch === '}') depth--;
    }
    if (started && depth <= 0) { ruleEnd = i; break; }
  }

  // Grab ~40 lines before the rule start to capture related helpers
  const contextStart = Math.max(ruleStart - 40, headerLines.length);
  const preContext = lines.slice(contextStart, ruleStart)
    .join('\n').trim();

  let result = headerLines.join('\n') + '\n';
  if (preContext) result += '\n# --- Related definitions ---\n' + preContext + '\n';
  result += `\n# --- Rule for ${controlId} ---\n` +
    lines.slice(ruleStart, ruleEnd + 1).join('\n');
  return result;
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

### Scan result analysis
When the user asks about a specific control — whether about its status, why it failed, what it means, or anything else — ALWAYS use the **analyze_scan_result** tool to get the full scan details. This tool combines the raw ScubaGear scan output with the official CISA baseline requirement. Use it for ANY question targeting a specific control ID: "why did X fail?", "what's my status for X?", "what's wrong with X?", "explain X", "tell me about X", etc. Extract specific findings: user names, group names, policy names, and settings that caused the result.

### Exclusion analysis
The user's scan data includes **exclusion configuration** from the ScubaGear config file and from Conditional Access Policies (CAPs). Use the **analyze_exclusions** tool when:
- The user asks "what exclusions do I have?", "show me my exclusions", or "list exclusions"
- A CAP-related control fails and you need to determine if unapproved exclusions are the cause
- The user asks about CapExclusions, AnnotatePolicy, OmitPolicy, or excluded users/groups
- Analysing any control that involves Conditional Access Policies (e.g. MS.AAD.3.6v1, MS.AAD.3.7v1, MS.AAD.3.8v1 and similar)

Exclusion types:
- **CapExclusions**: Approved user/group exclusions per control (e.g. break-glass accounts excluded from MS.AAD.3.6v1)
- **AnnotatePolicy**: Policies marked for manual review with custom notes
- **OmitPolicy**: Policies completely omitted from evaluation
- **CAP ExcludeUsers/ExcludeGroups**: Users and groups excluded within each Conditional Access Policy — these may or may not be approved

When analysing ANY Conditional Access Policy-related control (MS.AAD section 3 controls: 3.1 through 3.9), ALWAYS call analyze_exclusions — regardless of whether the user is asking about status, failure reasons, or general info. Exclusion configuration is critical context for ALL CAP controls. Cross-reference the CAP exclusions against the approved CapExclusions to identify gaps.

### Rego policy comparison
For deeper root-cause analysis of failures, use the **fetch_rego_policy** tool to retrieve the actual OPA Rego rule that ScubaGear used to evaluate the control. Compare the Rego logic against the **ActualValue** data from the scan to pinpoint exactly which condition failed. Walk through the Rego rule step-by-step, showing which conditions passed and which didn't match the actual configuration. This is the most precise way to explain WHY a control failed.

### Response guidelines
- Always ground your answers in either ScubaGear Baseline data or Microsoft Learn documentation.
- When discussing a failing control, first explain what the control requires, then explain why it failed based on the actual scan findings, then provide targeted remediation steps referencing the specific users/groups/policies found.
- Format responses in Markdown. Use headings, bullet lists, and tables.
- Be concise but thorough.
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
        const scanData = _currentControlDetails[controlId];

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

          const capsWithExclusions = _currentExclusionContext.exclusionAnalysis.filter(
            (a) => a.excludedUsers.length > 0 || a.excludedGroups.length > 0
          );
          if (capsWithExclusions.length > 0) {
            output += `### Conditional Access Policy Exclusion Analysis\n`;
            for (const analysis of capsWithExclusions) {
              const unapprovedUsers = analysis.excludedUsers.filter((u) => !u.approved);
              const unapprovedGroups = analysis.excludedGroups.filter((g) => !g.approved);
              const approvedUsers = analysis.excludedUsers.filter((u) => u.approved);
              const approvedGroups = analysis.excludedGroups.filter((g) => g.approved);

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

        return output;
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

      messages.push({ role: 'user', content: message });

      // Agentic loop
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-4o',
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
      const finalCompletion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
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
