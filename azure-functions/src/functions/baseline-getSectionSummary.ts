/**
 * Azure Function: baseline-getSectionSummary
 * 
 * GET /api/baseline/section?number=3
 * 
 * Returns a summary of controls in a specific baseline section.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  AAD_SECTIONS,
  HIGHLY_PRIVILEGED_ROLES,
  getControlsBySection,
} from '../shared/baseline-data.js';

app.http('baseline-getSectionSummary', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/section',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const numParam = request.query.get('number');

    if (!numParam) {
      return { status: 400, jsonBody: { error: 'number query parameter is required (1-8)' } };
    }

    const sectionNumber = parseInt(numParam, 10);
    if (isNaN(sectionNumber) || sectionNumber < 1 || sectionNumber > 8) {
      return { status: 400, jsonBody: { error: 'Section number must be between 1 and 8' } };
    }

    const sectionName = AAD_SECTIONS[sectionNumber];
    const controls = getControlsBySection(sectionNumber);

    const shallCount = controls.filter(
      (c) => c.criticality === 'SHALL' || c.criticality === 'SHALL NOT'
    ).length;
    const shouldCount = controls.filter(
      (c) => c.criticality === 'SHOULD' || c.criticality === 'SHOULD NOT'
    ).length;
    const autoCount = controls.filter((c) => c.checkType === 'Automated').length;
    const manualCount = controls.filter((c) => c.checkType === 'Manual').length;
    const bodCount = controls.filter((c) => c.bod2501).length;

    return {
      status: 200,
      jsonBody: {
        sectionNumber,
        sectionName,
        totalControls: controls.length,
        shallCount,
        shouldCount,
        automatedChecks: autoCount,
        manualChecks: manualCount,
        bod2501Count: bodCount,
        controls: controls.map((c) => ({
          id: c.id,
          title: c.title,
          criticality: c.criticality,
          checkType: c.checkType,
          bod2501: c.bod2501,
          nistMapping: c.nistMapping,
          lastModified: c.lastModified,
        })),
        ...(sectionNumber === 7
          ? { highlyPrivilegedRoles: HIGHLY_PRIVILEGED_ROLES }
          : {}),
      },
    };
  },
});
