/**
 * Azure Function: learn-getArticle
 * 
 * GET /api/learn/article?url=https://learn.microsoft.com/...
 * 
 * Fetches and returns the content of a Microsoft Learn article.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { fetchArticle } from '../shared/learn-fetcher.js';

app.http('learn-getArticle', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'learn/article',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const url = request.query.get('url');

    if (!url) {
      return { status: 400, jsonBody: { error: 'url query parameter is required' } };
    }

    if (!url.startsWith('https://learn.microsoft.com')) {
      return { status: 400, jsonBody: { error: 'Only Microsoft Learn URLs are supported' } };
    }

    const article = await fetchArticle(url);

    if (!article) {
      return { status: 404, jsonBody: { error: `Could not fetch article at: ${url}` } };
    }

    return {
      status: 200,
      jsonBody: {
        title: article.title,
        url: article.url,
        content: article.content,
        lastUpdated: article.lastUpdated,
      },
    };
  },
});
