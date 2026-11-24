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
import { detectAndParse, computeSummary, buildChatContext, buildProductBreakdown, extractExclusionContext, getControlExclusionNote, detectReportVersion, annotateBaselineStatus, PRODUCT_DISPLAY_NAMES } from '../shared/scubagear-parser.js';
import { compareToBaseline } from '../shared/baseline-changes.js';
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

      // Flag controls from older ScubaGear releases that the pinned baseline has since changed
      annotateBaselineStatus(controls);
      const versionInfo = compareToBaseline(detectReportVersion(data));

      // Extract exclusion context from Raw data (CAP exclusions, AnnotatePolicy, OmitPolicy, etc.)
      const exclusionContext = extractExclusionContext(data);

      const chatContext = buildChatContext(controls, exclusionContext, versionInfo);

      // Build product breakdown for Power Apps dashboard
      const productBreakdown = buildProductBreakdown(summary);

      // Build controls list for Power Apps gallery/table
      const controlsList = controls.map((c) => {
        const excNote = getControlExclusionNote(c.controlId, exclusionContext);
        return {
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
          hasExclusions: excNote.length > 0,
          exclusionNote: excNote,
          baselineStatus: c.baselineStatus || 'current',
          baselineNote: c.baselineNote || '',
          replacedBy: c.replacedBy ? c.replacedBy.join(', ') : '',
        };
      });

      return {
        status: 200,
        jsonBody: {
          format,
          scubaGearVersion: versionInfo.reportVersion || '',
          baselineVersion: versionInfo.baselineVersion,
          versionRelation: versionInfo.relation,
          versionNote: versionInfo.summary,
          baselineChangesSince: versionInfo.changesSince,
          summary: {
            total: summary.total,
            pass: summary.pass,
            fail: summary.fail,
            manual: summary.manual,
            thirdParty: summary.thirdParty,
            notImplemented: summary.notImplemented,
            omitted: summary.omitted,
            warning: summary.warning,
            error: summary.error,
            overallPassRate: summary.total > 0
              ? Math.round((summary.pass / summary.total) * 100)
              : 0,
          },
          productBreakdown,
          controls: controlsList,
          chatContext, // Send to chat endpoint for grounded responses
          exclusionContext: exclusionContext ? JSON.stringify(exclusionContext) : null, // Stringified for Power Apps compatibility
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
