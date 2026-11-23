/**
 * Azure Function: baseline-getRemediation
 * 
 * GET /api/baseline/remediation?controlId=MS.AAD.3.1v1
 * 
 * Returns remediation/implementation steps for a specific baseline control.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getControlById } from '../shared/baseline-data.js';
import { resolveControl } from '../shared/baseline-changes.js';

app.http('baseline-getRemediation', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/remediation',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const controlId = request.query.get('controlId');

    if (!controlId) {
      return { status: 400, jsonBody: { error: 'controlId query parameter is required' } };
    }

    if (!/^MS\.[A-Z0-9]{2,15}\.\d{1,3}\.\d{1,3}v\d{1,2}$/.test(controlId)) {
      return { status: 400, jsonBody: { error: 'Invalid controlId format' } };
    }

    const control = getControlById(controlId);
    if (!control) {
      const resolved = resolveControl(controlId);
      return {
        status: 404,
        jsonBody: {
          error: `Control '${controlId}' not found`,
          baselineStatus: resolved.status,
          baselineNote: resolved.note,
          replacedBy: resolved.replacements.map((r) => r.id),
        },
      };
    }

    return {
      status: 200,
      jsonBody: {
        controlId: control.id,
        title: control.title,
        rationale: control.rationale,
        implementation: control.implementation,
        licenseRequirements: control.licenseRequirements,
        notes: control.notes,
        resources: control.resources,
      },
    };
  },
});
