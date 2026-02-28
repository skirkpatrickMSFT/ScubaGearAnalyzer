/**
 * Azure Function: baseline-getControlInfo
 * 
 * GET /api/baseline/control?controlId=MS.AAD.1.1v1
 * 
 * Returns detailed information about a CISA ScubaGear baseline control.
 * Used by Power Apps and optionally Copilot Studio custom connector.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getControlById } from '../shared/baseline-data.js';

app.http('baseline-getControlInfo', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/control',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const controlId = request.query.get('controlId');

    if (!controlId) {
      return { status: 400, jsonBody: { error: 'controlId query parameter is required' } };
    }

    if (!/^MS\.[A-Z]{2,15}\.\d{1,3}\.\d{1,3}v\d{1,2}$/.test(controlId)) {
      return { status: 400, jsonBody: { error: 'Invalid controlId format. Expected: MS.AAD.1.1v1' } };
    }

    const control = getControlById(controlId);
    if (!control) {
      return { status: 404, jsonBody: { error: `Control '${controlId}' not found` } };
    }

    return {
      status: 200,
      jsonBody: {
        id: control.id,
        section: control.section,
        sectionNumber: control.sectionNumber,
        title: control.title,
        description: control.description,
        criticality: control.criticality,
        rationale: control.rationale,
        lastModified: control.lastModified,
        checkType: control.checkType,
        configurable: control.configurable,
        bod2501: control.bod2501,
        notes: control.notes,
        nistMapping: control.nistMapping,
        mitreMapping: control.mitreMapping,
        resources: control.resources,
        implementation: control.implementation,
        licenseRequirements: control.licenseRequirements,
      },
    };
  },
});
