/**
 * Azure Function: baseline-search
 * 
 * GET /api/baseline/search?query=MFA
 * 
 * Searches baseline controls by keyword.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { searchControls } from '../shared/baseline-data.js';

app.http('baseline-search', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'baseline/search',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const query = request.query.get('query');

    if (!query) {
      return { status: 400, jsonBody: { error: 'query parameter is required' } };
    }

    if (query.length > 200) {
      return { status: 400, jsonBody: { error: 'Query too long. Maximum 200 characters.' } };
    }

    const results = searchControls(query);

    return {
      status: 200,
      jsonBody: {
        query,
        count: results.length,
        results: results.map((c) => ({
          id: c.id,
          title: c.title,
          criticality: c.criticality,
          description: c.description,
          section: c.section,
          sectionNumber: c.sectionNumber,
        })),
      },
    };
  },
});
