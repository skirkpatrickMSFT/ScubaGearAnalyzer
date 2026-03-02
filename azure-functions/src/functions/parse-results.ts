/**
 * Azure Function: parse-results
 * 
 * POST /api/parse-results
 * Body: ScubaGear TestResults.json or ScubaResults merged JSON
 * 
 * Parses uploaded ScubaGear results and returns structured compliance data.
 * Used by Power Apps to populate the dashboard and by the chat function
 * to build assessment context.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { detectAndParse, computeSummary, buildChatContext, PRODUCT_DISPLAY_NAMES } from '../shared/scubagear-parser.js';
import type { ScubaProduct } from '../shared/types.js';

app.http('parse-results', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'parse-results',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const data = await request.json();

      if (!data) {
        return { status: 400, jsonBody: { error: 'Request body must contain ScubaGear JSON data' } };
      }

      const { controls, format } = detectAndParse(data);

      if (controls.length === 0) {
        return {
          status: 400,
          jsonBody: {
            error: 'Could not parse any controls from the uploaded data. Ensure this is a valid ScubaGear TestResults.json or ScubaResults JSON file.',
          },
        };
      }

      const summary = computeSummary(controls);
      const chatContext = buildChatContext(controls);

      // Build product breakdown for Power Apps dashboard
      const productBreakdown = (Object.keys(PRODUCT_DISPLAY_NAMES) as ScubaProduct[])
        .filter((p) => summary.byProduct[p].total > 0)
        .map((p) => ({
          product: p,
          displayName: PRODUCT_DISPLAY_NAMES[p],
          total: summary.byProduct[p].total,
          pass: summary.byProduct[p].pass,
          fail: summary.byProduct[p].fail,
          passRate: summary.byProduct[p].total > 0
            ? Math.round((summary.byProduct[p].pass / summary.byProduct[p].total) * 100)
            : 0,
        }));

      // Build controls list for Power Apps gallery/table
      const controlsList = controls.map((c) => ({
        controlId: c.controlId,
        product: c.product,
        productDisplayName: PRODUCT_DISPLAY_NAMES[c.product] || c.product,
        section: c.section,
        status: c.status,
        criticality: c.criticality,
        reportDetails: c.reportDetails.slice(0, 500),
        requirementMet: c.requirementMet,
        isOmitted: c.isOmitted || false,
        isIncorrectResult: c.isIncorrectResult || false,
        actualValue: c.actualValue ? c.actualValue.slice(0, 8000) : '',
      }));

      return {
        status: 200,
        jsonBody: {
          format,
          summary: {
            total: summary.total,
            pass: summary.pass,
            fail: summary.fail,
            manual: summary.manual,
            thirdParty: summary.thirdParty,
            notImplemented: summary.notImplemented,
            omitted: summary.omitted,
            overallPassRate: summary.total > 0
              ? Math.round((summary.pass / summary.total) * 100)
              : 0,
          },
          productBreakdown,
          controls: controlsList,
          chatContext, // Send to chat endpoint for grounded responses
        },
      };
    } catch (error: any) {
      context.error('Parse results error:', error);
      return {
        status: 500,
        jsonBody: { error: `Failed to parse results: ${error.message}` },
      };
    }
  },
});
