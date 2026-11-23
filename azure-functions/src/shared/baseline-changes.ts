/**
 * Query helpers over the generated ScubaGear baseline release history.
 *
 * Data lives in `baseline-changes.generated.ts` (produced by
 * `scripts/generate-baselines.mjs`); only hand-written logic belongs here.
 */

import type {
  BaselineChange,
  BaselineChangeType,
  BaselineControl,
  BaselineRelease,
  LegacyControl,
  RemovedPolicy,
} from './baseline-types.js';
import {
  BASELINE_CHANGES,
  BASELINE_HISTORY_TARGET_TAG,
  BASELINE_RELEASES,
  LEGACY_CONTROLS,
  REMOVED_POLICIES,
} from './baseline-changes.generated.js';
import { ALL_BASELINE_CONTROLS, SCUBAGEAR_BASELINE_VERSION, canonicalizeProduct } from './baseline-data.js';

export { BASELINE_CHANGES, BASELINE_RELEASES, LEGACY_CONTROLS, REMOVED_POLICIES, BASELINE_HISTORY_TARGET_TAG };

// ── Versions ────────────────────────────────────────────────

/** Normalises "v2.0", "2.0.0" or "2.0.0-rc1" to "2.0.0"; null when unparseable. */
export function normalizeVersion(raw: string | null | undefined): string | null {
  const m = String(raw ?? '').trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
  return m ? `${m[1]}.${m[2] ?? 0}.${m[3] ?? 0}` : null;
}

export function compareVersions(a: string, b: string): number {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

const stemOf = (id: string): string => id.replace(/v\d+$/i, '').toLowerCase();

export function getReleases(): BaselineRelease[] {
  return BASELINE_RELEASES;
}

export function getRelease(version: string): BaselineRelease | undefined {
  const v = normalizeVersion(version);
  return v ? BASELINE_RELEASES.find((r) => r.version === v) : undefined;
}

// ── Change queries ──────────────────────────────────────────

export interface ChangeQuery {
  /** The release the user is on; only changes published after it are returned. */
  from?: string;
  /** Upper bound (inclusive). Defaults to the pinned baseline. */
  to?: string;
  product?: string;
  controlId?: string;
  types?: BaselineChangeType[];
}

/**
 * Changes are recorded between consecutive releases, so `from` selects every
 * transition that starts at or after it, and `to` every one that ends at or before it.
 */
export function getChanges(query: ChangeQuery = {}): BaselineChange[] {
  const from = normalizeVersion(query.from);
  const to = normalizeVersion(query.to);
  const product = query.product ? canonicalizeProduct(query.product) : null;
  const stem = query.controlId ? stemOf(query.controlId) : null;

  return BASELINE_CHANGES.filter((c) => {
    if (from && compareVersions(c.fromVersion, from) < 0) return false;
    if (to && compareVersions(c.toVersion, to) > 0) return false;
    if (product && canonicalizeProduct(c.product) !== product) return false;
    if (query.types?.length && !query.types.includes(c.type)) return false;
    if (stem) {
      const related = [c.controlId, c.fromId, c.toId, ...(c.replacedBy ?? []), ...(c.replaces ?? [])];
      if (!related.some((id) => id && stemOf(id) === stem)) return false;
    }
    return true;
  });
}

// ── Control resolution (current vs. older reports) ──────────

export type ControlBaselineStatus = 'current' | 'versionDrift' | 'removed' | 'unknown';

export interface ControlResolution {
  requested: string;
  status: ControlBaselineStatus;
  /** The control in the pinned baseline (the exact match, or its newer version). */
  control?: BaselineControl;
  /** Details from the release that last shipped a removed control. */
  legacy?: LegacyControl;
  removedPolicy?: RemovedPolicy;
  /** Current-baseline controls that took over a removed control's requirement. */
  replacements: BaselineControl[];
  note: string;
}

function byId(id: string): BaselineControl | undefined {
  const wanted = id.toLowerCase();
  return ALL_BASELINE_CONTROLS.find((c) => c.id.toLowerCase() === wanted);
}

export function resolveControl(controlId: string): ControlResolution {
  const requested = (controlId ?? '').trim();
  const exact = byId(requested);
  if (exact) return { requested, status: 'current', control: exact, replacements: [], note: '' };

  const stem = stemOf(requested);
  const drifted = stem ? ALL_BASELINE_CONTROLS.find((c) => stemOf(c.id) === stem) : undefined;
  if (drifted) {
    const bump = BASELINE_CHANGES.find(
      (c) => c.type === 'versioned' && c.fromId?.toLowerCase() === requested.toLowerCase(),
    );
    const detail = bump
      ? ` Changed in ${bump.toVersion}: ${bump.note || `${bump.fields?.join(', ')} updated`}.`
      : '';
    return {
      requested,
      status: 'versionDrift',
      control: drifted,
      replacements: [],
      note: `${requested} is now ${drifted.id} in baseline v${SCUBAGEAR_BASELINE_VERSION}.${detail}`,
    };
  }

  const legacy = LEGACY_CONTROLS.find((c) => c.id.toLowerCase() === requested.toLowerCase())
    ?? LEGACY_CONTROLS.find((c) => stemOf(c.id) === stem);
  const removedPolicy = REMOVED_POLICIES.find((r) => stemOf(r.id) === stem);
  if (legacy || removedPolicy) {
    const replacements = (legacy?.replacedBy ?? [])
      .map(byId)
      .filter((c): c is BaselineControl => Boolean(c));
    const where = legacy?.removedIn ? ` in ${legacy.removedIn}` : '';
    const why = legacy?.removalRationale || removedPolicy?.rationale || '';
    const next = replacements.length
      ? ` Replaced by ${replacements.map((r) => r.id).join(', ')}.`
      : ' No replacement control was published.';
    return {
      requested,
      status: 'removed',
      legacy,
      removedPolicy,
      replacements,
      note: `${requested} was removed from the baseline${where}.${next}${why ? ` ${why}` : ''}`,
    };
  }

  return {
    requested,
    status: 'unknown',
    replacements: [],
    note: `${requested} is not in any known ScubaGear baseline release.`,
  };
}

/** Full lifecycle of one control: what it is today plus every recorded change. */
export function getControlHistory(controlId: string) {
  const resolution = resolveControl(controlId);
  const timeline = getChanges({ controlId });
  return { resolution, timeline };
}

// ── Report version comparison ───────────────────────────────

export type VersionRelation = 'older' | 'same' | 'newer' | 'unknown';

export interface VersionComparison {
  reportVersion: string | null;
  baselineVersion: string;
  relation: VersionRelation;
  /** Number of recorded baseline changes between the report's version and the baseline. */
  changesSince: number;
  summary: string;
}

export function compareToBaseline(reportVersion: string | null | undefined): VersionComparison {
  const baselineVersion = SCUBAGEAR_BASELINE_VERSION;
  const rv = normalizeVersion(reportVersion);
  if (!rv) {
    return {
      reportVersion: null,
      baselineVersion,
      relation: 'unknown',
      changesSince: 0,
      summary: `The ScubaGear version that produced this report is unknown. Baseline data is v${baselineVersion}.`,
    };
  }

  const cmp = compareVersions(rv, baselineVersion);
  const relation: VersionRelation = cmp < 0 ? 'older' : cmp > 0 ? 'newer' : 'same';
  const changesSince = relation === 'older' ? getChanges({ from: rv }).length : 0;

  const summary =
    relation === 'same'
      ? `Report generated by ScubaGear ${rv}, matching baseline v${baselineVersion}.`
      : relation === 'older'
        ? `Report generated by ScubaGear ${rv}; the analyzer baseline is v${baselineVersion}. ` +
          `${changesSince} baseline change(s) were published in between, so some control IDs and requirements may differ from what this report evaluated. ` +
          'Use the baseline changes tools to explain them.'
        : `Report generated by ScubaGear ${rv}, newer than the analyzer baseline (v${baselineVersion}). ` +
          'Controls added in newer releases may be reported as unknown.';

  return { reportVersion: rv, baselineVersion, relation, changesSince, summary };
}

// ── Formatting ──────────────────────────────────────────────

const clip = (s: string | undefined, n = 280): string => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

export function describeChange(c: BaselineChange): string {
  const span = `${c.fromVersion} → ${c.toVersion}`;
  switch (c.type) {
    case 'added': {
      const replaces = c.replaces?.length ? ` Replaces/absorbs: ${c.replaces.join(', ')}.` : '';
      return `**${c.controlId}** added in ${c.toVersion} [${c.criticality?.to ?? '?'}]: ${clip(c.title?.to)}${replaces}`;
    }
    case 'removed': {
      const repl = c.replacedBy?.length ? ` Replaced by ${c.replacedBy.join(', ')}.` : ' No replacement.';
      return `**${c.controlId}** removed in ${c.toVersion} [${c.criticality?.from ?? '?'}]: ${clip(c.title?.from)}${repl}${c.note ? ` Reason: ${clip(c.note, 400)}` : ''}`;
    }
    case 'versioned': {
      const crit =
        c.criticality?.from && c.criticality.from !== c.criticality.to
          ? ` Criticality ${c.criticality.from} → ${c.criticality.to}.`
          : '';
      const text = c.title
        ? ` Requirement was: "${clip(c.title.from)}" Now: "${clip(c.title.to)}"`
        : '';
      return `**${c.fromId} → ${c.toId}** (${span}) re-versioned; changed: ${c.fields?.join(', ')}.${crit}${text}${c.note ? ` Note: ${clip(c.note, 400)}` : ''}`;
    }
    default: {
      const crit =
        c.criticality?.from && c.criticality.from !== c.criticality.to
          ? ` Criticality ${c.criticality.from} → ${c.criticality.to}.`
          : '';
      const text = c.title
        ? ` Requirement was: "${clip(c.title.from)}" Now: "${clip(c.title.to)}"`
        : '';
      return `**${c.controlId}** revised (${span}); changed: ${c.fields?.join(', ')}.${crit}${text}`;
    }
  }
}

export function summarizeChanges(changes: BaselineChange[]): Record<BaselineChangeType, number> {
  const out: Record<BaselineChangeType, number> = { added: 0, removed: 0, revised: 0, versioned: 0 };
  for (const c of changes) out[c.type]++;
  return out;
}

/** Groups changes by release transition, then by change type, as chat-friendly markdown. */
export function formatChangesMarkdown(changes: BaselineChange[], maxItemsPerGroup = 40): string {
  if (changes.length === 0) return 'No recorded baseline changes match that query.';

  const transitions = [...new Set(changes.map((c) => `${c.fromVersion}→${c.toVersion}`))];
  const order: BaselineChangeType[] = ['removed', 'added', 'versioned', 'revised'];
  const heading: Record<BaselineChangeType, string> = {
    removed: 'Removed',
    added: 'Added',
    versioned: 'Re-versioned (requirement changed)',
    revised: 'Revised in place',
  };

  const out: string[] = [];
  for (const t of transitions) {
    const [fromV, toV] = t.split('→');
    const slice = changes.filter((c) => c.fromVersion === fromV && c.toVersion === toV);
    const counts = summarizeChanges(slice);
    out.push(
      `## ${fromV} → ${toV}\n${counts.added} added, ${counts.removed} removed, ${counts.versioned} re-versioned, ${counts.revised} revised`,
    );
    for (const type of order) {
      const group = slice.filter((c) => c.type === type);
      if (group.length === 0) continue;
      out.push(`### ${heading[type]} (${group.length})`);
      for (const c of group.slice(0, maxItemsPerGroup)) out.push(`- ${describeChange(c)}`);
      if (group.length > maxItemsPerGroup) out.push(`- …and ${group.length - maxItemsPerGroup} more (narrow by product or control)`);
    }
  }
  return out.join('\n');
}
