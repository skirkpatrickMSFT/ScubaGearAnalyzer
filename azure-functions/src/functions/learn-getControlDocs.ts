/**
 * Azure Function: learn-getControlDocs
 * 
 * GET /api/learn/control-docs?controlId=MS.AAD.1.1v1&fetchContent=false
 * 
 * Returns Microsoft Learn URLs (and optionally content) mapped to a ScubaGear control.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getLearnUrlsForControl, fetchArticle, searchLearn } from '../shared/learn-fetcher.js';

app.http('learn-getControlDocs', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'learn/control-docs',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const controlId = request.query.get('controlId');
    const fetchContent = request.query.get('fetchContent') === 'true';

    if (!controlId) {
      return { status: 400, jsonBody: { error: 'controlId query parameter is required' } };
    }

    const urls = getLearnUrlsForControl(controlId);

    if (urls.length === 0) {
      // Fallback: search Learn
      const searchResults = await searchLearn(`scubagear ${controlId} entra azure ad`, 3);
      return {
        status: 200,
        jsonBody: {
          controlId,
          mapped: false,
          count: searchResults.length,
          results: searchResults.map((r) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          })),
        },
      };
    }

    if (fetchContent) {
      const articles = await Promise.all(
        urls.map(async (url) => {
          const article = await fetchArticle(url);
          return article
            ? { title: article.title, url: article.url, content: article.content, lastUpdated: article.lastUpdated }
            : { title: 'Error', url, content: 'Could not fetch article', lastUpdated: null };
        })
      );
      return {
        status: 200,
        jsonBody: { controlId, mapped: true, count: articles.length, articles },
      };
    }

    return {
      status: 200,
      jsonBody: {
        controlId,
        mapped: true,
        count: urls.length,
        urls,
      },
    };
  },
});
