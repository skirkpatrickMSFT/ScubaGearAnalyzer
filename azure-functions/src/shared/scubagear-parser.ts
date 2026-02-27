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
} from './types.js';

/** Map of product abbreviations to display names */
export const PRODUCT_DISPLAY_NAMES: Record<ScubaProduct, string> = {
  AAD: 'Microsoft Entra ID',
  DEFENDER: 'Microsoft Defender',
  EXO: 'Exchange Online',
  SHAREPOINT: 'SharePoint Online',
  TEAMS: 'Microsoft Teams',
  POWERPLATFORM: 'Power Platform',
  POWERBI: 'Power BI',
};

/** Map ScubaResults product keys to our canonical product enum */
const PRODUCT_KEY_MAP: Record<string, ScubaProduct> = {
  AAD: 'AAD', DEFENDER: 'DEFENDER', EXO: 'EXO', SHAREPOINT: 'SHAREPOINT',
  TEAMS: 'TEAMS', POWERPLATFORM: 'POWERPLATFORM', POWERBI: 'POWERBI',
  Aad: 'AAD', Defender: 'DEFENDER', Exo: 'EXO', SharePoint: 'SHAREPOINT',
  Teams: 'TEAMS', PowerPlatform: 'POWERPLATFORM', PowerBI: 'POWERBI',
};

export function extractProduct(policyId: string): ScubaProduct | null {
  if (!policyId) return null;
  const match = policyId.match(/^MS\.([A-Z]+)\.\d+/);
  if (!match) return null;
  return match[1] as ScubaProduct;
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

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0027/gi, "'");
}

export function parseTestResults(raw: ScubaGearTestResult[]): ParsedControl[] {
  return raw
    .map((r) => {
      const product = extractProduct(r.PolicyId);
      if (!product) return null;
      return {
        controlId: r.PolicyId, product,
        section: extractSection(r.PolicyId),
        status: deriveStatus(r),
        criticality: normaliseCriticality(r.Criticality),
        reportDetails: stripHtml(r.ReportDetails),
        requirementMet: r.RequirementMet,
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
    const product = PRODUCT_KEY_MAP[key] || PRODUCT_KEY_MAP[key.toUpperCase()];
    if (!product || !Array.isArray(groups)) continue;
    for (const group of groups) {
      if (!group.Controls || !Array.isArray(group.Controls)) continue;
      for (const ctrl of group.Controls) {
        const controlId = ctrl['Control ID'];
        if (!controlId) continue;
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
          controlId, product,
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

export function computeSummary(controls: ParsedControl[]): AssessmentSummary {
  const products = Object.keys(PRODUCT_DISPLAY_NAMES) as ScubaProduct[];
  const byProduct = {} as Record<ScubaProduct, { total: number; pass: number; fail: number }>;
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

const MAX_CONTEXT_CHARS = 80_000;

export function buildChatContext(controls: ParsedControl[]): string {
  const lines: string[] = ['# ScubaGear Assessment Results\n'];
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
  const context = lines.join('\n');
  if (context.length > MAX_CONTEXT_CHARS) {
    return context.slice(0, MAX_CONTEXT_CHARS) + '\n\n[Context truncated due to size]';
  }
  return context;
}
