/**
 * Evidence and triage helpers that turn raw scan data into material the chat can reason over:
 * Conditional Access policy tables, near-miss decisions with ready-to-paste config, identity
 * cross-references, and a prioritised list of failing controls.
 *
 * Everything here is deterministic and works only from the uploaded report and the bundled
 * baselines, so the chat never has to infer these facts.
 */

import type { ConditionalAccessPolicySummary, ExclusionContext } from './types.js';
import { canonicalizeProduct, getControlById } from './baseline-data.js';
import { resolveControl } from './baseline-changes.js';
import { extractProduct, getRelevantCAPCategories } from './scubagear-parser.js';

export interface ControlScan {
  status: string;
  reportDetails: string;
  actualValue?: string;
}

export type ScanMap = Record<string, ControlScan>;

export interface NearMiss {
  policyName: string;
  /** What ScubaGear says is missing from the config, e.g. "user exclusions". */
  missing: string;
}

const NEAR_MISS_RE = /Near miss:\s*(.+?)\s+would pass if the config file is updated to include:\s*([^.\n]+)/gi;

/** Reads ScubaGear 2.0's "Near miss" lines out of a control's report details. */
export function parseNearMisses(details: string): NearMiss[] {
  const found: NearMiss[] = [];
  for (const m of (details ?? '').matchAll(NEAR_MISS_RE)) {
    found.push({ policyName: m[1].trim(), missing: m[2].trim() });
  }
  return found;
}

const clip = (s: string, n: number): string => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

const cell = (s: string): string => s.replace(/\|/g, '\\|');

// ── Conditional Access evidence ─────────────────────────────

function stateLabel(state: string): string {
  switch (state.toLowerCase()) {
    case 'enabled':
      return 'enabled';
    case 'disabled':
      return 'DISABLED';
    case 'enabledforreportingbutnotenforced':
      return 'report-only (not enforced)';
    default:
      return state || 'unknown';
  }
}

function appliesTo(p: ConditionalAccessPolicySummary): string {
  const who: string[] = [];
  if (p.includeUsers.includes('All')) who.push('All users');
  else {
    if (p.includeUsers.length) who.push(`${p.includeUsers.length} user(s)`);
    if (p.includeGroups.length) who.push(`${p.includeGroups.length} group(s)`);
    if (p.includeRoles.length) who.push(`${p.includeRoles.length} role(s)`);
  }
  const apps = p.includeApps.includes('All')
    ? 'all apps'
    : p.includeApps.length
      ? `${p.includeApps.length} app(s)`
      : 'no apps';
  return `${who.join(', ') || 'no users'} → ${apps}`;
}

function requires(p: ConditionalAccessPolicySummary): string {
  const bits: string[] = [];
  if (p.authStrengthName) bits.push(p.authStrengthName);
  if (p.grantControls.length) bits.push(p.grantControls.join(' + '));
  return bits.join('; ') || '—';
}

function conditions(p: ConditionalAccessPolicySummary): string {
  const bits: string[] = [];
  if (p.userRiskLevels.length) bits.push(`user risk: ${p.userRiskLevels.join('/')}`);
  if (p.signInRiskLevels.length) bits.push(`sign-in risk: ${p.signInRiskLevels.join('/')}`);
  if (p.hasDeviceCodeFlowCondition) bits.push('device code flow');
  return bits.join('; ') || '—';
}

function approvedSets(ctx: ExclusionContext): { users: Set<string>; groups: Set<string> } {
  const users = new Set<string>();
  const groups = new Set<string>();
  for (const e of ctx.approvedExclusions) {
    for (const u of [...(e.capExclusions?.users ?? []), ...(e.roleExclusions?.users ?? [])]) users.add(u.toLowerCase());
    for (const g of [...(e.capExclusions?.groups ?? []), ...(e.roleExclusions?.groups ?? [])]) groups.add(g.toLowerCase());
  }
  return { users, groups };
}

interface UnapprovedExclusions {
  users: string[];
  groups: string[];
}

function unapprovedFor(p: ConditionalAccessPolicySummary, ctx: ExclusionContext): UnapprovedExclusions {
  const approved = approvedSets(ctx);
  return {
    users: p.excludeUsers.filter((u) => !approved.users.has(u.toLowerCase())),
    groups: p.excludeGroups.filter((g) => !approved.groups.has(g.toLowerCase())),
  };
}

const stateRank = (s: string): number =>
  s.toLowerCase() === 'enabled' ? 0 : s.toLowerCase().startsWith('enabledfor') ? 1 : 2;

function pickPolicies(
  controlId: string,
  ctx: ExclusionContext,
  nearMisses: NearMiss[],
): { shown: ConditionalAccessPolicySummary[]; hidden: number } {
  const names = new Set(nearMisses.map((n) => n.policyName.toLowerCase()));
  const categories = getRelevantCAPCategories(controlId) ?? [];
  const all = ctx.conditionalAccessPolicies;

  const chosen = new Set<ConditionalAccessPolicySummary>();
  for (const p of all) if (names.has(p.displayName.toLowerCase())) chosen.add(p);
  for (const p of all) if (categories.includes(p.category)) chosen.add(p);
  // Nothing matched: show the policies that could plausibly apply to everyone.
  if (chosen.size === 0) {
    for (const p of all) if (stateRank(p.state) < 2 && p.includeUsers.includes('All')) chosen.add(p);
  }

  const ordered = [...chosen].sort((a, b) => {
    const nm = Number(names.has(b.displayName.toLowerCase())) - Number(names.has(a.displayName.toLowerCase()));
    return nm || stateRank(a.state) - stateRank(b.state) || a.displayName.localeCompare(b.displayName);
  });
  const shown = ordered.slice(0, 8);
  return { shown, hidden: all.length - shown.length };
}

function referencesTo(id: string, ctx: ExclusionContext) {
  const excludedFrom: ConditionalAccessPolicySummary[] = [];
  const includedIn: ConditionalAccessPolicySummary[] = [];
  const target = id.toLowerCase();
  for (const p of ctx.conditionalAccessPolicies) {
    if ([...p.excludeUsers, ...p.excludeGroups].some((x) => x.toLowerCase() === target)) excludedFrom.push(p);
    if ([...p.includeUsers, ...p.includeGroups].some((x) => x.toLowerCase() === target)) includedIn.push(p);
  }
  return { excludedFrom, includedIn };
}

function describeRefs(list: ConditionalAccessPolicySummary[]): string {
  return list.map((p) => `"${p.displayName}" (${stateLabel(p.state)})`).join(', ');
}

/** Cross-references account / group GUIDs across every policy and explains how to resolve them. */
export function crossReferenceIds(
  ctx: ExclusionContext,
  users: string[],
  groups: string[],
): string {
  if (users.length === 0 && groups.length === 0) return '';
  const lines: string[] = ['### Who are these accounts?'];

  const entries: Array<{ id: string; kind: 'user' | 'group' }> = [
    ...users.map((id) => ({ id, kind: 'user' as const })),
    ...groups.map((id) => ({ id, kind: 'group' as const })),
  ].slice(0, 8);

  for (const { id, kind } of entries) {
    const known = kind === 'user' ? ctx.privilegedUsers.find((u) => u.id.toLowerCase() === id.toLowerCase()) : undefined;
    const refs = referencesTo(id, ctx);
    let line = `- \`${id}\` (${kind})`;
    line += known
      ? ` — **${known.displayName}**${known.roles.length ? `, roles: ${known.roles.join(', ')}` : ''}`
      : ' — name is not in the report (only privileged users are resolved)';
    if (refs.excludedFrom.length) line += `\n  - Excluded from: ${describeRefs(refs.excludedFrom)}`;
    if (refs.includedIn.length) line += `\n  - Included in: ${describeRefs(refs.includedIn)}`;
    lines.push(line);
  }

  const unresolvedUser = entries.find((e) => e.kind === 'user' && !ctx.privilegedUsers.some((u) => u.id.toLowerCase() === e.id.toLowerCase()));
  const unresolvedGroup = entries.find((e) => e.kind === 'group');
  if (unresolvedUser || unresolvedGroup) {
    lines.push('', 'To resolve a name (the report does not contain it):');
    if (unresolvedUser) {
      lines.push(
        `- Entra admin center → Users → search the object ID, or: \`az ad user show --id ${unresolvedUser.id} --query "{name:displayName, upn:userPrincipalName}" -o json\``,
      );
    }
    if (unresolvedGroup) {
      lines.push(`- Entra admin center → Groups → search the object ID, or: \`az ad group show --group ${unresolvedGroup.id} --query displayName -o tsv\``);
    }
  }
  return lines.join('\n');
}

/** A ScubaGear config fragment that approves the given exclusions for the given controls. */
export function buildConfigSnippet(controlIds: string[], users: string[], groups: string[]): string {
  const lines = ['Aad:'];
  for (const id of controlIds) {
    lines.push(`  ${id}:`, '    CapExclusions:');
    if (users.length) {
      lines.push('      Users:');
      for (const u of users) lines.push(`        - ${u}`);
    }
    if (groups.length) {
      lines.push('      Groups:');
      for (const g of groups) lines.push(`        - ${g}`);
    }
  }
  return lines.join('\n');
}

function wanted(missing: string): { users: boolean; groups: boolean } {
  const users = /user/i.test(missing);
  const groups = /group/i.test(missing);
  return users || groups ? { users, groups } : { users: true, groups: true };
}

/**
 * Builds the Conditional Access section for a control: the policies involved, ScubaGear's near
 * miss, the decision it forces, a config snippet, and who the excluded accounts are.
 * Returns an empty string for controls that are not Conditional Access based.
 */
export function buildCapAnalysis(controlId: string, ctx: ExclusionContext, scans: ScanMap): string {
  const isCap = getRelevantCAPCategories(controlId) !== null;
  const nearMisses = parseNearMisses(scans[controlId]?.reportDetails ?? '');
  if (!isCap && nearMisses.length === 0) return '';
  if (ctx.conditionalAccessPolicies.length === 0 && nearMisses.length === 0) return '';

  const out: string[] = [];
  const { shown, hidden } = pickPolicies(controlId, ctx, nearMisses);

  if (shown.length) {
    const nearNames = new Set(nearMisses.map((n) => n.policyName.toLowerCase()));
    out.push('### Policy evidence (from the report)');
    out.push('| Policy | State | Applies to | Requires | Conditions | Excluded (unapproved) |');
    out.push('|---|---|---|---|---|---|');
    for (const p of shown) {
      const un = unapprovedFor(p, ctx);
      const excluded = `${p.excludeUsers.length} user(s), ${p.excludeGroups.length} group(s) (${un.users.length + un.groups.length} unapproved)`;
      const flag = nearNames.has(p.displayName.toLowerCase()) ? ' ⚠️ near miss' : '';
      out.push(
        `| ${cell(p.displayName)}${flag} | ${stateLabel(p.state)} | ${cell(appliesTo(p))} | ${cell(requires(p))} | ${cell(conditions(p))} | ${excluded} |`,
      );
    }
    if (hidden > 0) out.push(`\n_${hidden} other policy(ies) in the tenant are not shown because they do not look relevant to this control._`);
  } else {
    out.push('### Policy evidence', 'No Conditional Access policies in the report look relevant to this control.');
  }

  for (const miss of nearMisses) {
    const policy = ctx.conditionalAccessPolicies.find((p) => p.displayName.toLowerCase() === miss.policyName.toLowerCase());
    out.push('', `### ScubaGear near miss: "${miss.policyName}"`);
    out.push(`ScubaGear reports this policy would satisfy ${controlId} if the config file approved: **${miss.missing}**.`);
    if (!policy) {
      out.push('The policy was not found in the report data, so its exclusions cannot be listed.');
      continue;
    }

    const un = unapprovedFor(policy, ctx);
    const want = wanted(miss.missing);
    const users = want.users ? un.users : [];
    const groups = want.groups ? un.groups : [];
    out.push(`Policy state: ${stateLabel(policy.state)}. Unapproved exclusions: ${users.length} user(s), ${groups.length} group(s).`);
    if (users.length === 0 && groups.length === 0) continue;

    // Other controls whose scan names the same policy share the same fix.
    const sharing = Object.keys(scans)
      .filter((id) => id !== controlId && parseNearMisses(scans[id].reportDetails).some((n) => n.policyName.toLowerCase() === miss.policyName.toLowerCase()))
      .sort();
    const controlIds = [controlId, ...sharing];

    out.push('', '### Decision', 'There are two valid fixes. Which is right depends on whether the exclusion is intentional:');
    out.push(
      `1. **Remove the exclusion from the policy** (Entra admin center → Protection → Conditional Access → Policies → "${policy.displayName}" → Users → Exclude). Choose this if the account should be covered by the control. This is the stronger fix.`,
    );
    out.push(
      '2. **Approve the exclusion in the ScubaGear config** so ScubaGear accepts it. Choose this only for accounts that are intentionally exempt, such as emergency-access accounts, because it tells ScubaGear the exemption is acceptable.',
    );
    out.push('', 'Config for option 2 (merge into your existing `Aad:` block, then re-run ScubaGear with that config file):');
    out.push('```yaml', buildConfigSnippet(controlIds, users, groups), '```');
    if (sharing.length) {
      out.push(`The same policy is also a near miss for ${sharing.join(', ')}, so the snippet covers those too.`);
    }
    out.push('', crossReferenceIds(ctx, users, groups));
  }

  return out.join('\n');
}

// ── Failure triage ──────────────────────────────────────────

const FAILING = new Set(['fail', 'warning']);

function sortKey(id: string): string {
  const m = id.match(/^MS\.([A-Z0-9]+)\.(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2].padStart(3, '0')}.${m[3].padStart(3, '0')}` : id;
}

function firstSentence(text: string): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  const end = t.search(/(?<=[.!?])\s/);
  return clip(end > 0 ? t.slice(0, end) : t, 130);
}

interface TriageItem {
  id: string;
  title: string;
  criticality: string;
  bod: boolean;
  checkType: string;
  status: string;
  detail: string;
  nearMiss?: NearMiss;
}

function triageLine(i: TriageItem): string {
  const tags = [i.criticality, i.bod ? 'BOD 25-01' : '', i.checkType].filter(Boolean).join(', ');
  const near = i.nearMiss ? ` ⚡ near miss: "${i.nearMiss.policyName}" needs ${i.nearMiss.missing}` : '';
  const detail = !i.nearMiss && i.detail ? ` — ${i.detail}` : '';
  return `- **${i.id}** [${tags}] ${clip(i.title, 110)}${near}${detail}`;
}

/** A prioritised view of everything failing in the uploaded report. */
export function prioritizeFailures(scans: ScanMap, options: { product?: string; limitPerTier?: number } = {}): string {
  const limit = Math.min(Math.max(options.limitPerTier ?? 15, 3), 40);
  const wantProduct = options.product ? canonicalizeProduct(options.product) : null;

  const counts: Record<string, number> = {};
  const failing: TriageItem[] = [];
  const errored: string[] = [];
  const olderRelease: string[] = [];
  let manual = 0;

  for (const [id, scan] of Object.entries(scans)) {
    if (wantProduct && extractProduct(id) !== wantProduct) continue;
    const status = (scan.status || 'Unknown').trim();
    counts[status] = (counts[status] ?? 0) + 1;

    const resolution = resolveControl(id);
    if (resolution.status === 'removed' || resolution.status === 'versionDrift') olderRelease.push(id);

    const lower = status.toLowerCase();
    if (lower === 'error') errored.push(id);
    if (lower === 'not-implemented' || lower === 'manual' || lower === '3rd party') manual++;
    if (!FAILING.has(lower)) continue;

    const baseline = getControlById(id);
    failing.push({
      id,
      title: baseline?.title ?? resolution.legacy?.title ?? '(control not in the current baseline)',
      criticality: baseline?.criticality ?? resolution.legacy?.criticality ?? 'UNKNOWN',
      bod: baseline?.bod2501 ?? false,
      checkType: baseline?.checkType ?? '',
      status,
      detail: firstSentence(scan.reportDetails),
      nearMiss: parseNearMisses(scan.reportDetails)[0],
    });
  }

  if (failing.length === 0) {
    return `No failing controls${wantProduct ? ` for ${wantProduct}` : ''} in the uploaded report.`;
  }

  const byOrder = (a: TriageItem, b: TriageItem) =>
    Number(!!b.nearMiss) - Number(!!a.nearMiss) || sortKey(a.id).localeCompare(sortKey(b.id));
  const must = (i: TriageItem) => i.criticality.startsWith('SHALL');

  const tiers: Array<{ title: string; items: TriageItem[] }> = [
    { title: '1. Required by BOD 25-01 (SHALL)', items: failing.filter((i) => i.bod && must(i)).sort(byOrder) },
    { title: '2. Other SHALL requirements', items: failing.filter((i) => !i.bod && must(i)).sort(byOrder) },
    { title: '3. SHOULD recommendations', items: failing.filter((i) => !must(i)).sort(byOrder) },
  ];
  const quickWins = failing.filter((i) => i.nearMiss).sort(byOrder);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const summary = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `${n} ${s}`)
    .join(', ');

  const byProduct: Record<string, number> = {};
  for (const i of failing) {
    const p = extractProduct(i.id) ?? 'OTHER';
    byProduct[p] = (byProduct[p] ?? 0) + 1;
  }
  const productCounts = Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${p} ${n}`)
    .join(', ');

  const out: string[] = [
    `# Failure triage${wantProduct ? ` — ${wantProduct}` : ''}`,
    `${failing.length} failing of ${total} controls (${summary}).`,
    ...(wantProduct ? [] : [`Failing by product: ${productCounts}.`]),
  ];

  if (quickWins.length) {
    out.push('', `## Quick wins — ${quickWins.length} control(s) ScubaGear says are one config change from passing`);
    for (const i of quickWins.slice(0, limit)) out.push(triageLine(i));
    out.push('_Approving an exclusion is a judgement call: confirm the account really is exempt before accepting it._');
  }

  for (const tier of tiers) {
    if (tier.items.length === 0) continue;
    out.push('', `## ${tier.title} — ${tier.items.length}`);
    for (const i of tier.items.slice(0, limit)) out.push(triageLine(i));
    if (tier.items.length > limit) out.push(`- …and ${tier.items.length - limit} more (ask for a single product to see them)`);
  }

  if (errored.length) out.push('', `## Checks that errored — ${errored.length}`, `${errored.sort().join(', ')}. These did not evaluate, so their status is unknown.`);
  if (manual) out.push('', `## Manual verification — ${manual} control(s) have no automated result and need to be checked by hand.`);
  if (olderRelease.length) {
    out.push('', `## From an older ScubaGear — ${olderRelease.length} control(s) were removed or re-versioned in the current baseline`, `${olderRelease.sort().slice(0, 20).join(', ')}. Use baseline_get_control_history to see what replaced them.`);
  }
  return out.join('\n');
}

// ── Understanding which controls a question is about ────────

const PRODUCT_WORDS: Record<string, string> = {
  aad: 'AAD',
  entra: 'AAD',
  'entra id': 'AAD',
  exo: 'EXO',
  exchange: 'EXO',
  defender: 'SECURITYSUITE',
  securitysuite: 'SECURITYSUITE',
  'security suite': 'SECURITYSUITE',
  sharepoint: 'SHAREPOINT',
  spo: 'SHAREPOINT',
  teams: 'TEAMS',
  powerplatform: 'POWERPLATFORM',
  'power platform': 'POWERPLATFORM',
  powerbi: 'POWERBI',
  'power bi': 'POWERBI',
};

const FULL_ID_RE = /\bMS\.[A-Z0-9]+\.\d+\.\d+(?:v\d+)?\b/gi;
const SHORT_RE = /\b(entra id|entra|aad|exo|exchange|defender|security ?suite|sharepoint|spo|teams|power ?platform|power ?bi)\s*(?:control|check|policy|requirement)?\s*#?(\d+)\.(\d+)(?:v\d+)?\b/gi;
const BARE_RE = /\b(?:check|control|policy|requirement|item)\s*#?(\d+)\.(\d+)(?:v\d+)?\b/gi;

/**
 * Phrasings that ask for failure clarification: why something fails, how to get it passing, what to
 * change. Questions about meaning, licensing, status or comparisons deliberately do not match.
 */
export const DIAGNOSIS_INTENT_RE = new RegExp(
  [
    String.raw`\bwhy\b[^?!]{0,100}\b(fail\w*|not pass\w*|isn'?t pass\w*|red|flagged|non-?complian\w*|wrong)\b`,
    String.raw`\bhow\b[^?!]{0,100}\b(pass|fix|resolve|remediate|satisfy|meet|correct|clear|green)\b`,
    String.raw`\b(get|make|bring)\b[^?!]{0,100}\bpass\w*\b`,
    String.raw`\bwhat(?:'s| is)? (?:wrong|the problem|the issue|causing)\b`,
    String.raw`\bwhat (?:do|should|must|can) i (?:change|do|fix|need)\b`,
    String.raw`\bneed to (?:change|do|fix|enable|configure)\b`,
    String.raw`\b(failing|failed|fails|failures?|not passing|won'?t pass|isn'?t passing|non-?complian\w*|not compliant)\b`,
    String.raw`\b(fix|resolve|remediate|remediation)\b`,
  ].join('|'),
  'i',
);

/** Phrases that ask about failures in general rather than about one control. */
export const FAILURE_INTENT_RE =
  /\b(failing|failures?|failed|fails|non-?complian\w*|what (should|do) i (fix|do|change)|fix first|priorit\w+|remediation plan|biggest risks?|get compliant|pass (all|my|the) (checks|controls))\b/i;

const stemOfId = (id: string): string => id.replace(/v\d+$/i, '').toUpperCase();

export interface ControlReferences {
  ids: string[];
  /**
   * Set when a bare number ("check 3.1") matches more than one failing control in different
   * products and nothing in the question says which. The caller resolves it from the conversation
   * or asks.
   */
  candidates: string[];
}

/**
 * Finds the controls a message refers to, however they are written: a full ID
 * ("MS.AAD.3.1v1"), shorthand ("entra 3.1", "aad check 3.1"), or a bare number
 * ("how do I pass check 3.1"), resolved against what is in the uploaded report.
 */
export function extractControlReferences(message: string, scans: ScanMap): ControlReferences {
  const text = message ?? '';
  const keys = Object.keys(scans);
  const ids: string[] = [];
  const candidates: string[] = [];
  const add = (id: string) => {
    if (!ids.some((x) => stemOfId(x) === stemOfId(id))) ids.push(id);
  };

  for (const m of text.matchAll(FULL_ID_RE)) {
    const wanted = m[0].toUpperCase();
    const exact = keys.find((k) => k.toUpperCase() === wanted);
    const drifted = keys.find((k) => stemOfId(k) === stemOfId(wanted));
    add(exact ?? drifted ?? m[0]);
  }

  const bySectionItem = (section: string, item: string, product?: string): string[] =>
    keys.filter((k) => {
      const m = k.match(/^MS\.([A-Z0-9]+)\.(\d+)\.(\d+)/i);
      return !!m && m[2] === section && m[3] === item && (!product || extractProduct(k) === product);
    });

  for (const m of text.matchAll(SHORT_RE)) {
    const product = PRODUCT_WORDS[m[1].toLowerCase().replace(/\s+/g, ' ')];
    if (!product) continue;
    const hits = bySectionItem(m[2], m[3], product);
    if (hits.length) hits.forEach(add);
    else {
      const baseline = getControlById(`MS.${product}.${m[2]}.${m[3]}v1`);
      if (baseline) add(baseline.id);
    }
  }

  for (const m of text.matchAll(BARE_RE)) {
    const hits = bySectionItem(m[1], m[2]);
    // With no product named, prefer the controls that are actually failing.
    const failing = hits.filter((k) => FAILING.has((scans[k].status ?? '').toLowerCase()));
    const pool = failing.length ? failing : hits;
    if (pool.length === 1) add(pool[0]);
    else candidates.push(...pool);
  }

  // A control named explicitly settles any ambiguity about the same number.
  const unresolved = candidates.filter((c) => !ids.some((id) => stemOfId(id) === stemOfId(c)));
  return { ids: ids.slice(0, 3), candidates: ids.length ? [] : unresolved.slice(0, 5) };
}

// ── Rego ────────────────────────────────────────────────────

/**
 * Extracts the Rego that evaluates one control: the section from its banner comment
 * (the helper rules that find matching policies, near misses, and so on) through the
 * `tests` rule that reports the result. Works for both the 1.x layout, where the rule
 * stands alone, and the 2.x layout, where helpers precede the `tests` rule.
 */
export function extractRegoRule(regoContent: string, controlId: string): string {
  const lines = regoContent.split('\n');

  // The `tests` entry names the control in a "PolicyId" field; other mentions are helper arguments.
  const needle = `"${controlId}"`;
  let policyIdx = lines.findIndex((l) => /"PolicyId"\s*:/.test(l) && l.includes(needle));
  if (policyIdx === -1) policyIdx = lines.findIndex((l) => l.includes(needle));
  if (policyIdx === -1) return `No Rego rule found for ${controlId} in the policy file.`;

  let ruleStart = policyIdx;
  for (let i = policyIdx; i >= 0; i--) {
    if (/^tests\s/.test(lines[i].trim())) {
      ruleStart = i;
      break;
    }
  }

  let depth = 0;
  let started = false;
  let ruleEnd = policyIdx;
  for (let i = ruleStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') {
        depth++;
        started = true;
      }
      if (ch === '}') depth--;
    }
    if (started && depth <= 0) {
      ruleEnd = i;
      break;
    }
  }

  // Walk back to this control's banner comment ("# MS.AAD.3.1v1"), within a sane distance.
  let sectionStart = Math.max(ruleStart - 40, 0);
  for (let i = ruleStart - 1; i >= Math.max(ruleStart - 140, 0); i--) {
    if (/^#\s*MS\.[A-Z0-9]+\.\d+\.\d+v\d+\s*$/.test(lines[i].trim())) {
      sectionStart = i;
      break;
    }
  }

  const header = lines.slice(0, 40).filter((l) => l.startsWith('package '));
  return `${header.join('\n')}\n# …imports omitted\n\n# --- Evaluation of ${controlId} ---\n${lines.slice(sectionStart, ruleEnd + 1).join('\n')}`;
}
