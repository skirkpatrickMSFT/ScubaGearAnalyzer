/**
 * Azure Function: learn-search
 * 
 * GET /api/learn/search?query=conditional+access&maxResults=5
 * 
 * Searches Microsoft Learn for documentation articles.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { searchLearn } from '../shared/learn-fetcher.js';

app.http('learn-search', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'learn/search',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const query = request.query.get('query');
    const maxResultsParam = request.query.get('maxResults');

    if (!query) {
      return { status: 400, jsonBody: { error: 'query parameter is required' } };
    }

    const maxResults = maxResultsParam
      ? Math.min(Math.max(parseInt(maxResultsParam, 10) || 5, 1), 10)
      : 5;

    const results = await searchLearn(query, maxResults);

    return {
      status: 200,
      jsonBody: {
        query,
        count: results.length,
        results: results.map((r) => ({
          title: r.title,
          url: r.url,
          description: r.description,
          lastUpdated: r.lastUpdated,
        })),
      },
    };
  },
});
