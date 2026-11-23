/**
 * Azure Function: baseline-getReleases
 *
 * GET /api/baseline/releases
 *
 * Lists the ScubaGear releases the baseline change history covers, with the
 * upstream "Baselines" release-note section for each (omit with includeNotes=false).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getReleases } from '../shared/baseline-changes.js';
import { SCUBAGEAR_BASELINE_VERSION } from '../shared/baseline-data.js';

app.http('baseline-getReleases', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/releases',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const includeNotes = request.query.get('includeNotes') !== 'false';
    return {
      status: 200,
      jsonBody: {
        baselineVersion: SCUBAGEAR_BASELINE_VERSION,
        releases: getReleases().map((r) => ({
          version: r.version,
          tag: r.tag,
          publishedAt: r.publishedAt,
          url: r.url,
          ...(includeNotes && { baselineNotes: r.baselineNotes }),
        })),
      },
    };
  },
});
