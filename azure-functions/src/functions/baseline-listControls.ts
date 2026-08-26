/**
 * Azure Function: baseline-listControls
 * 
 * GET /api/baseline/controls?section=3
 * 
 * Lists all baseline controls, optionally filtered by section number.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  ALL_BASELINE_CONTROLS,
  getSectionName,
  getControlsByProduct,
  getControlsBySection,
} from '../shared/baseline-data.js';

app.http('baseline-listControls', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/controls',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const sectionParam = request.query.get('section');
    const productParam = request.query.get('product') ?? undefined;

    let controls = productParam ? getControlsByProduct(productParam) : ALL_BASELINE_CONTROLS;
    let sectionName: string | undefined;

    if (sectionParam) {
      const sectionNum = parseInt(sectionParam, 10);
      if (isNaN(sectionNum) || sectionNum < 1) {
        return { status: 400, jsonBody: { error: 'Section must be a positive number' } };
      }
      controls = controls.filter((c) => c.sectionNumber === sectionNum);
      sectionName = getSectionName(sectionNum, productParam);
    }

    return {
      status: 200,
      jsonBody: {
        section: sectionName || 'All Sections',
        count: controls.length,
        controls: controls.map((c) => ({
          id: c.id,
          title: c.title,
          criticality: c.criticality,
          checkType: c.checkType,
          bod2501: c.bod2501,
          sectionNumber: c.sectionNumber,
          section: c.section,
        })),
      },
    };
  },
});
