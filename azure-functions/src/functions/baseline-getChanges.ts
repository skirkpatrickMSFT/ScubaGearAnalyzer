/**
 * Azure Function: baseline-getChanges
 *
 * GET /api/baseline/changes?from=1.8.0&to=2.0.0&product=AAD&controlId=MS.AAD.3.2v2&type=removed
 *
 * Returns what changed in the CISA ScubaGear baselines between releases:
 * added, removed, re-versioned and revised controls, plus upstream's
 * replacement mapping for removed controls. Every filter is optional.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  BASELINE_CHANGES,
  getChanges,
  getRelease,
  getReleases,
  normalizeVersion,
  summarizeChanges,
} from '../shared/baseline-changes.js';
import { SCUBAGEAR_BASELINE_VERSION } from '../shared/baseline-data.js';
import type { BaselineChangeType } from '../shared/baseline-types.js';

const CHANGE_TYPES: BaselineChangeType[] = ['added', 'removed', 'revised', 'versioned'];
const MAX_LIMIT = 500;

app.http('baseline-getChanges', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/changes',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const fromRaw = request.query.get('from');
    const toRaw = request.query.get('to');
    const controlId = request.query.get('controlId') || undefined;
    const product = request.query.get('product') || undefined;
    const typeRaw = request.query.get('type');
    const limit = Math.min(Math.max(Number(request.query.get('limit')) || 200, 1), MAX_LIMIT);

    const from = fromRaw ? normalizeVersion(fromRaw) : undefined;
    const to = toRaw ? normalizeVersion(toRaw) : undefined;
    if (fromRaw && !from) return { status: 400, jsonBody: { error: `Invalid from version '${fromRaw}'. Expected e.g. 1.8.0` } };
    if (toRaw && !to) return { status: 400, jsonBody: { error: `Invalid to version '${toRaw}'. Expected e.g. 2.0.0` } };

    if (controlId && !/^MS\.[A-Z0-9]{2,15}\.\d{1,3}\.\d{1,3}(v\d{1,2})?$/i.test(controlId)) {
      return { status: 400, jsonBody: { error: 'Invalid controlId format. Expected: MS.AAD.3.2v2' } };
    }

    let types: BaselineChangeType[] | undefined;
    if (typeRaw) {
      types = typeRaw.split(',').map((t) => t.trim().toLowerCase()) as BaselineChangeType[];
      const bad = types.find((t) => !CHANGE_TYPES.includes(t));
      if (bad) return { status: 400, jsonBody: { error: `Invalid type '${bad}'. Use: ${CHANGE_TYPES.join(', ')}` } };
    }

    const changes = getChanges({ from: from ?? undefined, to: to ?? undefined, product, controlId, types });

    // Release-note highlights for each transition covered by the result.
    const versions = [...new Set(changes.map((c) => c.toVersion))];
    const releaseNotes = versions
      .map((v) => getRelease(v))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({ version: r.version, publishedAt: r.publishedAt, url: r.url, baselineNotes: r.baselineNotes }));

    return {
      status: 200,
      jsonBody: {
        baselineVersion: SCUBAGEAR_BASELINE_VERSION,
        availableReleases: getReleases().map((r) => r.version),
        from: from ?? getReleases()[0]?.version ?? null,
        to: to ?? SCUBAGEAR_BASELINE_VERSION,
        totalRecorded: BASELINE_CHANGES.length,
        matched: changes.length,
        counts: summarizeChanges(changes),
        truncated: changes.length > limit,
        changes: changes.slice(0, limit),
        releaseNotes,
      },
    };
  },
});
