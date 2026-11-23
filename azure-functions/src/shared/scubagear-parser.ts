/**
 * ScubaGear TestResults.json Parser — Azure Functions edition
 * 
 * Parses the flat array of test results produced by ScubaGear into
 * normalised controls grouped by product and section.
 */

import type {
  ScubaGearTestResult,
  ParsedControl,
  ControlStatus,
  ScubaProduct,
  AssessmentSummary,
  ScubaResultsControl,
  ScubaResultsGroup,
  ExclusionContext,
  ControlExclusionConfig,
  PolicyVariableConfig,
  AnnotatePolicyConfig,
  OmitPolicyConfig,
  PrivilegedUser,
  ConditionalAccessPolicySummary,
  CAPExclusionAnalysis,
  CAPCategory,
} from './types.js';
import {
  PRODUCT_DISPLAY_NAMES,
  SCUBAGEAR_BASELINE_VERSION,
  canonicalizeProduct,
} from './baseline-data.js';
import { resolveControl, type VersionComparison } from './baseline-changes.js';

export { PRODUCT_DISPLAY_NAMES };

/** scuba_config keys that hold policy overrides rather than product configuration. */
const TOP_LEVEL_POLICY_KEYS = new Set(['AnnotatePolicy', 'OmitPolicy']);

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/** Reads the ScubaGear version that produced a ScubaResults.json (`MetaData.ToolVersion`). */
export function detectReportVersion(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const root = data as Record<string, unknown>;
  const meta = (root.MetaData ?? root.Metadata) as Record<string, unknown> | undefined;
  const v = meta?.ToolVersion;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/**
 * Flags controls whose ID is not in the pinned baseline — typically results from an
 * older ScubaGear release — and records what replaced them.
 */
export function annotateBaselineStatus(controls: ParsedControl[]): ParsedControl[] {
  for (const c of controls) {
    const r = resolveControl(c.controlId);
    if (r.status === 'current') continue;
    c.baselineStatus = r.status;
    c.baselineNote = r.note;
    if (r.replacements.length) c.replacedBy = r.replacements.map((x) => x.id);
  }
  return controls;
}

export function extractProduct(policyId: string): ScubaProduct | null {
  if (!policyId) return null;
  const match = policyId.match(/^MS\.([A-Z0-9]+)\.\d+/);
  if (!match) return null;
  return canonicalizeProduct(match[1]);
}

export function extractSection(policyId: string): string {
  if (!policyId) return '0';
  const match = policyId.match(/^MS\.[A-Z]+\.(\d+)\./);
  return match ? match[1] : '0';
}

function deriveStatus(result: ScubaGearTestResult): ControlStatus {
  const crit = (result.Criticality || '').toLowerCase();
  if (result.RequirementMet) return 'Pass';
  if (crit.includes('not-implemented')) return 'Not-Implemented';
  if (crit.includes('3rd party')) return '3rd Party';
  return 'Fail';
}

function normaliseCriticality(raw: string): string {
  if (!raw) return 'UNKNOWN';
  const base = raw.split('/')[0].trim().toUpperCase();
  if (base === 'SHALL' || base === 'SHOULD') return base;
  if (base.includes('NOT')) return base;
  return base;
}

/** Release the bundled baselines were generated from; override for pre-release testing. */
export const SCUBAGEAR_CURRENT_VERSION =
  process.env.SCUBAGEAR_CURRENT_VERSION || SCUBAGEAR_BASELINE_VERSION;

/** Rewrite outdated ScubaGear GitHub baseline URLs to the current release */
function rewriteScubaGearUrls(text: string): string {
  return text.replace(
    /https:\/\/github\.com\/cisagov\/ScubaGear\/blob\/[^/]+\/baselines\//gi,
    `https://github.com/cisagov/ScubaGear/blob/v${SCUBAGEAR_CURRENT_VERSION}/PowerShell/ScubaGear/baselines/`,
  );
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return rewriteScubaGearUrls(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/\\u003c/gi, '<')
      .replace(/\\u003e/gi, '>')
      .replace(/\\u0027/gi, "'"),
  );
}

export function parseTestResults(raw: ScubaGearTestResult[]): ParsedControl[] {
  return raw
    .map((r) => {
      const product = extractProduct(r.PolicyId);
      if (!product) return null;
      // Stringify ActualValue for downstream consumption (chat AI analysis)
      let actualValue: string | undefined;
      if (r.ActualValue !== undefined && r.ActualValue !== null) {
        try {
          actualValue = typeof r.ActualValue === 'string'
            ? r.ActualValue
            : JSON.stringify(r.ActualValue, null, 2);
        } catch { actualValue = String(r.ActualValue); }
      }
      return {
        controlId: r.PolicyId, product,
        section: extractSection(r.PolicyId),
        status: deriveStatus(r),
        criticality: normaliseCriticality(r.Criticality),
        reportDetails: stripHtml(r.ReportDetails),
        requirementMet: r.RequirementMet,
        actualValue,
      } as ParsedControl;
    })
    .filter(Boolean) as ParsedControl[];
}

function deriveStatusFromResult(resultStr: string): ControlStatus {
  const r = (resultStr || '').trim();
  if (r === 'Pass') return 'Pass';
  if (r === 'Fail') return 'Fail';
  if (r === 'Warning') return 'Warning';
  if (r === 'Omitted') return 'Omitted';
  if (r === 'Error' || r.startsWith('Error')) return 'Error';
  if (r === 'Incorrect result') return 'Fail';
  if (r.includes('3rd Party') || r.includes('N/A')) return '3rd Party';
  if (r.includes('Not-Implemented') || r === 'Manual') return 'Not-Implemented';
  return 'Fail';
}

export function parseScubaResults(
  resultsObj: Record<string, ScubaResultsGroup[]>
): ParsedControl[] {
  const controls: ParsedControl[] = [];
  for (const [key, groups] of Object.entries(resultsObj)) {
    if (!Array.isArray(groups)) continue;
    const product = canonicalizeProduct(key);
    if (!product) continue;
    for (const group of groups) {
      if (!group.Controls || !Array.isArray(group.Controls)) continue;
      for (const ctrl of group.Controls) {
        const controlId = ctrl['Control ID'];
        if (!controlId) continue;
        // The Control ID is authoritative; the JSON group key can lag a rename.
        const ctrlProduct = extractProduct(controlId) ?? product;
        const resultStr = ctrl.Result || '';
        const isOmitted = resultStr === 'Omitted';
        const isIncorrectResult = resultStr === 'Incorrect result' ||
          (ctrl.IncorrectResult !== undefined && ctrl.IncorrectResult !== 'N/A');
        const rawComments = ctrl.Comments;
        const comments: string[] = [];
        if (Array.isArray(rawComments)) {
          for (const c of rawComments) {
            if (typeof c === 'string' && c.trim()) comments.push(c.trim());
          }
        } else if (typeof rawComments === 'string' && rawComments.trim()) {
          comments.push(rawComments.trim());
        }
        controls.push({
          controlId, product: ctrlProduct,
          section: extractSection(controlId),
          status: deriveStatusFromResult(resultStr),
          criticality: normaliseCriticality(ctrl.Criticality),
          reportDetails: stripHtml(ctrl.Details),
          requirementMet: resultStr === 'Pass',
          isOmitted,
          omittedEvaluationResult: isOmitted && ctrl.OmittedEvaluationResult !== 'N/A'
            ? ctrl.OmittedEvaluationResult : undefined,
          isIncorrectResult,
          originalResult: isIncorrectResult && ctrl.OriginalResult ? ctrl.OriginalResult : undefined,
          comments: comments.length > 0 ? comments : undefined,
          resolutionDate: ctrl.ResolutionDate || undefined,
        });
      }
    }
  }
  return controls;
}

export function detectAndParse(data: unknown): { controls: ParsedControl[]; format: string } {
  if (Array.isArray(data)) {
    return { controls: parseTestResults(data as ScubaGearTestResult[]), format: 'TestResults' };
  }
  if (typeof data === 'object' && data !== null && 'Results' in data) {
    const results = (data as Record<string, unknown>).Results;
    if (Array.isArray(results)) {
      return { controls: parseTestResults(results as ScubaGearTestResult[]), format: 'TestResults' };
    }
    if (typeof results === 'object' && results !== null) {
      const controls = parseScubaResults(results as Record<string, ScubaResultsGroup[]>);
      if (controls.length > 0) return { controls, format: 'ScubaResults' };
    }
  }
  return { controls: [], format: 'unknown' };
}

// ── Exclusion Context Extraction ─────────────────────────────

/**
 * Classify a conditional access policy into a category based on its configuration.
 * This determines which ScubaGear control the policy is relevant to.
 */
function classifyPolicy(cap: ConditionalAccessPolicySummary): CAPCategory {
  const targetsAllUsers = cap.includeUsers.includes('All');
  const targetsRoles = cap.includeRoles.length > 0;
  const hasPhishingResistantAuth = cap.authStrengthName.toLowerCase().includes('phishing');
  const requiresMfa = cap.grantControls.includes('mfa');
  const requiresBlock = cap.grantControls.includes('block');
  const requiresManagedDevice =
    cap.grantControls.includes('compliantDevice') ||
    cap.grantControls.includes('domainJoinedDevice');
  const isRiskBased = cap.userRiskLevels.length > 0 || cap.signInRiskLevels.length > 0;
  const isLegacyAuth =
    cap.clientAppTypes.includes('exchangeActiveSync') ||
    cap.clientAppTypes.includes('other');
  const isDeviceCodeBlock = cap.hasDeviceCodeFlowCondition;

  // Order matters — more specific checks first
  if (isDeviceCodeBlock && requiresBlock) return 'block-device-code';
  if (isLegacyAuth && requiresBlock) return 'block-legacy-auth';
  if (isRiskBased) return 'risk-based';
  if (targetsRoles && (hasPhishingResistantAuth || requiresMfa)) return 'phishing-resistant-mfa-privileged-roles';
  if (requiresManagedDevice) return 'require-managed-device';
  if (targetsAllUsers && hasPhishingResistantAuth) return 'phishing-resistant-mfa-all-users';
  if (targetsAllUsers && requiresMfa) return 'mfa-all-users';
  return 'other';
}

/**
 * Map a ScubaGear MS.AAD.3.x control to the CAP categories it evaluates.
 * Returns null for non-CAP-based controls (3.3, 3.4, 3.5).
 */
function getRelevantCAPCategories(controlId: string): CAPCategory[] | null {
  // Normalise to just the base control (strip version e.g. 3.1v1 → 3.1)
  const match = controlId.match(/^MS\.AAD\.3\.(\d+)/);
  if (!match) return null;
  const controlNum = parseInt(match[1], 10);

  switch (controlNum) {
    case 1: // Phishing-resistant MFA for all users
      return ['phishing-resistant-mfa-all-users'];
    case 2: // Alternative MFA for all users
      return ['mfa-all-users'];
    case 3: // Microsoft Authenticator config — NOT CAP-based
    case 4: // Authentication Methods Migration — NOT CAP-based
    case 5: // Disable SMS/Voice/Email OTP — NOT CAP-based
      return null;
    case 6: // Phishing-resistant MFA for privileged roles
      return ['phishing-resistant-mfa-privileged-roles'];
    case 7: // Managed devices required for authentication
    case 8: // Managed devices for MFA registration
      return ['require-managed-device'];
    case 9: // Block device code authentication
      return ['block-device-code'];
    default:
      return null;
  }
}

/**
 * Extract exclusion-related data from the Raw section of a ScubaResults JSON.
 * This includes:
 * - Approved CAP exclusions from scuba_config
 * - AnnotatePolicy / OmitPolicy overrides
 * - Privileged users (GUID-to-name mapping)
 * - Conditional access policies with their user/group exclusions
 * - Cross-referenced exclusion analysis
 */
export function extractExclusionContext(data: unknown): ExclusionContext | null {
  if (!data || typeof data !== 'object') return null;

  const root = data as Record<string, unknown>;
  const raw = root.Raw as Record<string, unknown> | undefined;
  if (!raw) return null;

  const scubaConfig = raw.scuba_config as Record<string, unknown> | undefined;
  const capPolicies = raw.conditional_access_policies as unknown[] | undefined;
  const privUsers = raw.privileged_users as Record<string, unknown> | undefined;

  // 1. Extract approved exclusions from scuba_config per-product sections
  const approvedExclusions: ControlExclusionConfig[] = [];
  const policyVariables: PolicyVariableConfig[] = [];
  if (scubaConfig) {
    for (const [key, value] of Object.entries(scubaConfig)) {
      if (TOP_LEVEL_POLICY_KEYS.has(key)) continue;
      // Product-level keys like "Aad", "Defender", etc. contain per-control configs
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const productConfig = value as Record<string, unknown>;
        for (const [controlId, controlConfig] of Object.entries(productConfig)) {
          if (!controlId.startsWith('MS.')) continue;
          if (typeof controlConfig !== 'object' || controlConfig === null) continue;
          const cc = controlConfig as Record<string, unknown>;

          if (cc.CapExclusions && typeof cc.CapExclusions === 'object') {
            const ce = cc.CapExclusions as Record<string, unknown>;
            approvedExclusions.push({
              controlId,
              capExclusions: {
                users: strList(ce.Users),
                groups: strList(ce.Groups),
                applications: strList(ce.Applications),
                guestUserTypes: strList(ce.GuestUserTypes),
              },
            });
          }

          if (cc.RoleExclusions && typeof cc.RoleExclusions === 'object') {
            const re = cc.RoleExclusions as Record<string, unknown>;
            const existing = approvedExclusions.find((e) => e.controlId === controlId);
            const roleExclusions = { users: strList(re.Users), groups: strList(re.Groups) };
            if (existing) existing.roleExclusions = roleExclusions;
            else approvedExclusions.push({ controlId, roleExclusions });
          }

          // Anything else is a policy variable (SensitiveAccounts, AllowedForwardingDomains, ...).
          const variables: PolicyVariableConfig['variables'] = {};
          for (const [varName, varValue] of Object.entries(cc)) {
            if (varName === 'CapExclusions' || varName === 'RoleExclusions') continue;
            if (Array.isArray(varValue)) {
              variables[varName] = varValue.map(String);
            } else if (varValue && typeof varValue === 'object') {
              const nested: Record<string, string[]> = {};
              for (const [k, v] of Object.entries(varValue as Record<string, unknown>)) {
                if (Array.isArray(v)) nested[k] = v.map(String);
              }
              if (Object.keys(nested).length > 0) variables[varName] = nested;
            } else if (varValue != null) {
              variables[varName] = [String(varValue)];
            }
          }
          if (Object.keys(variables).length > 0) {
            policyVariables.push({ controlId, product: canonicalizeProduct(key), variables });
          }
        }
      }
    }
  }

  // 2. Extract AnnotatePolicy overrides
  const annotatedPolicies: AnnotatePolicyConfig[] = [];
  if (scubaConfig?.AnnotatePolicy && typeof scubaConfig.AnnotatePolicy === 'object') {
    for (const [controlId, config] of Object.entries(scubaConfig.AnnotatePolicy as Record<string, unknown>)) {
      const c = config as Record<string, unknown>;
      annotatedPolicies.push({
        controlId,
        incorrectResult: !!c.IncorrectResult,
        comment: String(c.Comment || ''),
        remediationDate: c.RemediationDate != null ? String(c.RemediationDate) : undefined,
      });
    }
  }

  // 3. Extract OmitPolicy overrides
  const omittedPolicies: OmitPolicyConfig[] = [];
  if (scubaConfig?.OmitPolicy && typeof scubaConfig.OmitPolicy === 'object') {
    for (const [controlId, config] of Object.entries(scubaConfig.OmitPolicy as Record<string, unknown>)) {
      const c = config as Record<string, unknown>;
      omittedPolicies.push({
        controlId,
        expiration: String(c.Expiration || ''),
        rationale: String(c.Rationale || ''),
      });
    }
  }

  // 4. Extract privileged users (GUID → name mapping)
  const privilegedUsers: PrivilegedUser[] = [];
  if (privUsers && typeof privUsers === 'object') {
    for (const [id, userData] of Object.entries(privUsers)) {
      const u = userData as Record<string, unknown>;
      privilegedUsers.push({
        id,
        displayName: String(u.DisplayName || 'Unknown'),
        roles: Array.isArray(u.roles) ? u.roles.map(String) : [],
        onPremisesImmutableId: u.OnPremisesImmutableId != null ? String(u.OnPremisesImmutableId) : null,
      });
    }
  }

  // 5. Extract conditional access policies
  const conditionalAccessPolicies: ConditionalAccessPolicySummary[] = [];
  if (Array.isArray(capPolicies)) {
    for (const policy of capPolicies) {
      const p = policy as Record<string, unknown>;
      const conditions = p.Conditions as Record<string, unknown> | undefined;
      const users = conditions?.Users as Record<string, unknown> | undefined;
      const grantControls = p.GrantControls as Record<string, unknown> | undefined;
      const authStrength = grantControls?.AuthenticationStrength as Record<string, unknown> | undefined;
      const authFlows = conditions?.AuthenticationFlows as Record<string, unknown> | undefined;

      const capSummary: ConditionalAccessPolicySummary = {
        id: String(p.Id || ''),
        displayName: String(p.DisplayName || ''),
        state: String(p.State || ''),
        excludeUsers: Array.isArray(users?.ExcludeUsers) ? users!.ExcludeUsers.map(String) : [],
        excludeGroups: Array.isArray(users?.ExcludeGroups) ? users!.ExcludeGroups.map(String) : [],
        includeUsers: Array.isArray(users?.IncludeUsers) ? users!.IncludeUsers.map(String) : [],
        includeGroups: Array.isArray(users?.IncludeGroups) ? users!.IncludeGroups.map(String) : [],
        includeRoles: Array.isArray(users?.IncludeRoles) ? users!.IncludeRoles.map(String) : [],
        grantControls: Array.isArray(grantControls?.BuiltInControls)
          ? grantControls!.BuiltInControls.map(String)
          : [],
        clientAppTypes: Array.isArray(conditions?.ClientAppTypes)
          ? (conditions!.ClientAppTypes as string[]).map(String)
          : [],
        authStrengthName: authStrength?.DisplayName ? String(authStrength.DisplayName) : '',
        userRiskLevels: Array.isArray(conditions?.UserRiskLevels)
          ? (conditions!.UserRiskLevels as string[]).map(String)
          : [],
        signInRiskLevels: Array.isArray(conditions?.SignInRiskLevels)
          ? (conditions!.SignInRiskLevels as string[]).filter((r) => r && r.length > 0).map(String)
          : [],
        hasDeviceCodeFlowCondition: String(authFlows?.TransferMethods || '').toLowerCase().includes('devicecode'),
        category: 'other', // computed below
      };
      capSummary.category = classifyPolicy(capSummary);
      conditionalAccessPolicies.push(capSummary);
    }
  }

  // 6. Build cross-referenced exclusion analysis
  // Collect ALL approved user/group IDs across all control exclusion configs
  const allApprovedUsers = new Set<string>();
  const allApprovedGroups = new Set<string>();
  for (const exc of approvedExclusions) {
    if (exc.capExclusions) {
      for (const u of exc.capExclusions.users) allApprovedUsers.add(u.toLowerCase());
      for (const g of exc.capExclusions.groups) allApprovedGroups.add(g.toLowerCase());
    }
    if (exc.roleExclusions) {
      for (const u of exc.roleExclusions.users) allApprovedUsers.add(u.toLowerCase());
      for (const g of exc.roleExclusions.groups) allApprovedGroups.add(g.toLowerCase());
    }
  }

  const exclusionAnalysis: CAPExclusionAnalysis[] = [];
  for (const cap of conditionalAccessPolicies) {
    // Only analyze active/report-only policies that apply broadly (include "All" users)
    if (cap.state === 'disabled') continue;
    if (!cap.includeUsers.includes('All') && cap.includeRoles.length === 0) continue;

    const excludedUsers = cap.excludeUsers.map((uid) => {
      const priv = privilegedUsers.find((pu) => pu.id === uid);
      return {
        id: uid,
        displayName: priv?.displayName || uid,
        approved: allApprovedUsers.has(uid.toLowerCase()),
      };
    });

    const excludedGroups = cap.excludeGroups.map((gid) => ({
      id: gid,
      approved: allApprovedGroups.has(gid.toLowerCase()),
    }));

    const unapprovedUserCount = excludedUsers.filter((u) => !u.approved).length;
    const unapprovedGroupCount = excludedGroups.filter((g) => !g.approved).length;

    exclusionAnalysis.push({
      policyId: cap.id,
      policyName: cap.displayName,
      policyState: cap.state,
      policyCategory: cap.category,
      excludedUsers,
      excludedGroups,
      unapprovedUserCount,
      unapprovedGroupCount,
    });
  }

  return {
    approvedExclusions,
    policyVariables,
    annotatedPolicies,
    omittedPolicies,
    privilegedUsers,
    conditionalAccessPolicies,
    exclusionAnalysis,
  };
}

/**
 * Get exclusion note for a specific control ID.
 * Returns a short human-readable note (or empty string if no exclusions apply).
 */
export function getControlExclusionNote(controlId: string, ctx: ExclusionContext | null): string {
  if (!ctx) return '';
  const notes: string[] = [];

  // Check if control has approved CAP exclusions
  const approved = ctx.approvedExclusions.find((e) => e.controlId === controlId);
  if (approved) {
    const parts: string[] = [];
    if (approved.capExclusions) {
      const ce = approved.capExclusions;
      if (ce.users.length > 0) parts.push(`${ce.users.length} user(s)`);
      if (ce.groups.length > 0) parts.push(`${ce.groups.length} group(s)`);
      if (ce.applications.length > 0) parts.push(`${ce.applications.length} app(s)`);
      if (ce.guestUserTypes.length > 0) parts.push(`${ce.guestUserTypes.length} guest type(s)`);
    }
    if (approved.roleExclusions) {
      const re = approved.roleExclusions;
      if (re.users.length > 0) parts.push(`${re.users.length} role user(s)`);
      if (re.groups.length > 0) parts.push(`${re.groups.length} role group(s)`);
    }
    if (parts.length > 0) notes.push(`✅ Approved: ${parts.join(', ')}`);
  }

  // Policy-specific config variables (e.g. AllowedForwardingDomains)
  const vars = ctx.policyVariables.find((v) => v.controlId === controlId);
  if (vars) {
    notes.push(`⚙️ Configured: ${Object.keys(vars.variables).join(', ')}`);
  }

  // Check if control is annotated (false positive)
  const annotated = ctx.annotatedPolicies.find((a) => a.controlId === controlId);
  if (annotated) {
    if (annotated.incorrectResult) {
      notes.push('📝 Marked incorrect result');
    } else if (annotated.remediationDate) {
      notes.push(`📝 Remediation due ${annotated.remediationDate}`);
    } else {
      notes.push('📝 Annotated');
    }
  }

  // Check if control is omitted
  const omitted = ctx.omittedPolicies.find((o) => o.controlId === controlId);
  if (omitted) {
    notes.push(omitted.expiration ? `⏭️ Omitted until ${omitted.expiration}` : '⏭️ Omitted');
  }

  // For AAD Section 3 (Conditional Access) controls, check relevant CAPs only
  const relevantCategories = getRelevantCAPCategories(controlId);
  if (relevantCategories) {
    // Filter to only policies whose category matches this control's concern
    const relevantAnalysis = ctx.exclusionAnalysis.filter(
      (a) =>
        relevantCategories.includes(a.policyCategory) &&
        (a.unapprovedUserCount > 0 || a.unapprovedGroupCount > 0),
    );
    if (relevantAnalysis.length > 0) {
      // Compact per-policy detail with user/group breakdown
      const parts: string[] = [];
      for (const a of relevantAnalysis) {
        const details: string[] = [];
        if (a.unapprovedUserCount > 0) details.push(`${a.unapprovedUserCount} user(s)`);
        if (a.unapprovedGroupCount > 0) details.push(`${a.unapprovedGroupCount} group(s)`);
        parts.push(`${a.policyName} [${details.join(', ')}]`);
      }
      notes.push(`⚠️ Unapproved exclusions: ${parts.join('; ')}`);
    }
  }

  return notes.join(' | ');
}

/**
 * Resolve a user GUID to a display name using the privileged users list.
 */
export function resolveUserName(userId: string, privilegedUsers: PrivilegedUser[]): string {
  const user = privilegedUsers.find((u) => u.id === userId);
  return user ? `${user.displayName} (${userId})` : userId;
}

/**
 * Build a human-readable exclusion summary for chat context.
 */
export function buildExclusionSummary(ctx: ExclusionContext): string {
  const lines: string[] = ['# Exclusion & Override Configuration\n'];

  // Approved exclusions
  if (ctx.approvedExclusions.length > 0) {
    lines.push('## Approved Exclusions (from ScubaGear config)');
    for (const exc of ctx.approvedExclusions) {
      lines.push(`### ${exc.controlId}`);
      if (exc.capExclusions) {
        const ce = exc.capExclusions;
        if (ce.users.length > 0) {
          lines.push('**Approved excluded users:**');
          for (const uid of ce.users) {
            lines.push(`  - ${resolveUserName(uid, ctx.privilegedUsers)}`);
          }
        }
        if (ce.groups.length > 0) {
          lines.push('**Approved excluded groups:**');
          for (const gid of ce.groups) {
            lines.push(`  - ${gid}`);
          }
        }
        if (ce.applications.length > 0) {
          lines.push(`**Approved excluded applications:** ${ce.applications.join(', ')}`);
        }
        if (ce.guestUserTypes.length > 0) {
          lines.push(`**Approved excluded guest user types:** ${ce.guestUserTypes.join(', ')}`);
        }
      }
      if (exc.roleExclusions) {
        const re = exc.roleExclusions;
        if (re.users.length > 0) {
          lines.push('**Role-excluded users:**');
          for (const uid of re.users) {
            lines.push(`  - ${resolveUserName(uid, ctx.privilegedUsers)}`);
          }
        }
        if (re.groups.length > 0) {
          lines.push(`**Role-excluded groups:** ${re.groups.join(', ')}`);
        }
      }
    }
    lines.push('');
  }

  // Policy-specific configuration variables
  if (ctx.policyVariables.length > 0) {
    lines.push('## Policy Configuration Variables');
    lines.push('Values supplied in the ScubaGear config that the Rego checks evaluate against:\n');
    for (const pv of ctx.policyVariables) {
      lines.push(`### ${pv.controlId}`);
      for (const [name, value] of Object.entries(pv.variables)) {
        if (Array.isArray(value)) {
          lines.push(`- **${name}**: ${value.join(', ') || '(empty)'}`);
        } else {
          lines.push(`- **${name}**:`);
          for (const [k, v] of Object.entries(value)) {
            lines.push(`  - ${k}: ${v.join(', ') || '(empty)'}`);
          }
        }
      }
    }
    lines.push('');
  }

  // Policy overrides
  if (ctx.annotatedPolicies.length > 0) {
    lines.push('## Annotated Policies');
    for (const ap of ctx.annotatedPolicies) {
      const tags: string[] = [];
      if (ap.incorrectResult) tags.push('marked incorrect result');
      if (ap.remediationDate) tags.push(`remediation due ${ap.remediationDate}`);
      const suffix = tags.length > 0 ? ` _(${tags.join('; ')})_` : '';
      lines.push(`- **${ap.controlId}**: ${ap.comment}${suffix}`);
    }
    lines.push('');
  }
  if (ctx.omittedPolicies.length > 0) {
    lines.push('## Omitted Policies');
    for (const op of ctx.omittedPolicies) {
      const expiry = op.expiration ? `Expires ${op.expiration} — ` : '';
      lines.push(`- **${op.controlId}**: ${expiry}${op.rationale}`);
    }
    lines.push('');
  }

  // CAP exclusion analysis
  const capsWithExclusions = ctx.exclusionAnalysis.filter(
    (a) => a.excludedUsers.length > 0 || a.excludedGroups.length > 0,
  );
  if (capsWithExclusions.length > 0) {
    lines.push('## Conditional Access Policy Exclusion Analysis');
    lines.push('Policies with user/group exclusions (cross-referenced against approved list):\n');
    for (const cap of capsWithExclusions) {
      const stateLabel = cap.policyState === 'enabled' ? '🟢 On'
        : cap.policyState === 'enabledForReportingButNotEnforced' ? '🟡 Report-only'
          : cap.policyState;
      lines.push(`### ${cap.policyName} [${stateLabel}]`);

      if (cap.excludedUsers.length > 0) {
        lines.push('**Excluded users:**');
        for (const u of cap.excludedUsers) {
          const tag = u.approved ? '✅ approved' : '⚠️ NOT in approved list';
          lines.push(`  - ${u.displayName} — ${tag}`);
        }
      }
      if (cap.excludedGroups.length > 0) {
        lines.push('**Excluded groups:**');
        for (const g of cap.excludedGroups) {
          const tag = g.approved ? '✅ approved' : '⚠️ NOT in approved list';
          lines.push(`  - ${g.id} — ${tag}`);
        }
      }
      if (cap.unapprovedUserCount > 0 || cap.unapprovedGroupCount > 0) {
        lines.push(`⚠️ **${cap.unapprovedUserCount} unapproved user(s), ${cap.unapprovedGroupCount} unapproved group(s)** — these may cause MS.AAD.3.6v1 or related controls to fail.`);
      }
      lines.push('');
    }
    lines.push(`📋 **Guidance:** Review unapproved exclusions and add to ScubaGear config YAML under \`Aad → CapExclusions\` to pass related controls. See: https://github.com/cisagov/ScubaGear/blob/v${SCUBAGEAR_CURRENT_VERSION}/docs/configuration/parameters.md`);
    lines.push('');
  }

  return lines.join('\n');
}

export function computeSummary(controls: ParsedControl[]): AssessmentSummary {
  // Union the bundled products with anything present in the results, so a product
  // added or renamed upstream still shows up in the breakdown.
  const products = Array.from(
    new Set([...Object.keys(PRODUCT_DISPLAY_NAMES), ...controls.map((c) => c.product)]),
  );
  const byProduct: Record<string, { total: number; pass: number; fail: number }> = {};
  for (const p of products) {
    const pControls = controls.filter((c) => c.product === p);
    byProduct[p] = {
      total: pControls.length,
      pass: pControls.filter((c) => c.status === 'Pass').length,
      fail: pControls.filter((c) => c.status === 'Fail').length,
    };
  }
  return {
    total: controls.length,
    pass: controls.filter((c) => c.status === 'Pass').length,
    fail: controls.filter((c) => c.status === 'Fail').length,
    manual: controls.filter((c) => c.status === 'Not-Implemented').length,
    thirdParty: controls.filter((c) => c.status === '3rd Party').length,
    notImplemented: controls.filter((c) => c.status === 'Not-Implemented').length,
    omitted: controls.filter((c) => c.status === 'Omitted').length,
    byProduct,
  };
}

const MAX_CONTEXT_CHARS = 120_000;

export function buildChatContext(
  controls: ParsedControl[],
  exclusionCtx?: ExclusionContext | null,
  versionInfo?: VersionComparison | null,
): string {
  const lines: string[] = ['# ScubaGear Assessment Results\n'];
  if (versionInfo) {
    lines.push(`> ${versionInfo.summary}\n`);
  }
  const products = [...new Set(controls.map((c) => c.product))].sort();
  for (const product of products) {
    const pControls = controls.filter((c) => c.product === product);
    const pass = pControls.filter((c) => c.status === 'Pass').length;
    const fail = pControls.filter((c) => c.status === 'Fail').length;
    const manual = pControls.filter((c) => c.status === 'Not-Implemented' || c.status === '3rd Party').length;
    lines.push(`## ${PRODUCT_DISPLAY_NAMES[product] || product} (${pass} pass, ${fail} fail, ${manual} manual)`);
    for (const c of pControls) {
      const icon = c.status === 'Pass' ? '✅' : c.status === 'Fail' ? '❌' : c.status === 'Omitted' ? '⏭️' : '📋';
      let line = `${icon} **${c.controlId}** [${c.criticality}] — ${c.status}`;
      if (c.baselineStatus === 'removed') {
        line += c.replacedBy?.length
          ? ` (REMOVED from baseline; now ${c.replacedBy.join(', ')})`
          : ' (REMOVED from baseline)';
      } else if (c.baselineStatus === 'versionDrift') {
        line += ' (control re-versioned in newer baseline)';
      }
      if (c.isOmitted) {
        line += ' (OMITTED via config)';
        if (c.omittedEvaluationResult) line += ` [would be: ${c.omittedEvaluationResult}]`;
      }
      if (c.isIncorrectResult) {
        line += ` (MARKED INCORRECT — original: ${c.originalResult || 'unknown'})`;
      }
      if (c.comments && c.comments.length > 0) {
        line += `\n   💬 ${c.comments.join('; ').slice(0, 200)}`;
      }
      lines.push(line);
      if (c.status !== 'Pass' && c.status !== 'Omitted') {
        lines.push(`   ${c.reportDetails.slice(0, 300)}`);
      }
    }
    lines.push('');
  }

  // Append exclusion context if available
  if (exclusionCtx) {
    lines.push('\n---\n');
    lines.push(buildExclusionSummary(exclusionCtx));
  }

  const context = lines.join('\n');
  if (context.length > MAX_CONTEXT_CHARS) {
    return context.slice(0, MAX_CONTEXT_CHARS) + '\n\n[Context truncated due to size]';
  }
  return context;
}
