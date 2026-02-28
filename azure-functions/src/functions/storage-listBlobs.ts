/**
 * Azure Function: storage-listBlobs
 *
 * GET /api/storage/list-blobs
 * Query params:
 *   - storageAccountName: Azure Storage account name
 *   - containerName: Blob container name
 *   - sasToken: Shared Access Signature token (query string, with or without leading ?)
 *   - prefix: (optional) Blob name prefix filter (e.g. "2026/02/")
 *
 * Lists blobs in a ScubaConnect output container so users can
 * browse ScubaGear result files and pick one to load.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ContainerClient } from '@azure/storage-blob';

app.http('storage-listBlobs', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'storage/list-blobs',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const storageAccountName = request.query.get('storageAccountName');
      const containerName = request.query.get('containerName');
      let sasToken = request.query.get('sasToken');
      const prefix = request.query.get('prefix') || '';

      if (!storageAccountName || !containerName || !sasToken) {
        return {
          status: 400,
          jsonBody: {
            error: 'Missing required query parameters: storageAccountName, containerName, sasToken',
          },
        };
      }

      // Normalize SAS token — ensure it starts with '?'
      if (!sasToken.startsWith('?')) {
        sasToken = '?' + sasToken;
      }

      const containerUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}${sasToken}`;
      const containerClient = new ContainerClient(containerUrl);

      const blobs: Array<{
        name: string;
        lastModified: string;
        size: number;
      }> = [];

      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        // Only include JSON files (ScubaResults.json, TestResults*.json, etc.)
        if (blob.name.toLowerCase().endsWith('.json')) {
          blobs.push({
            name: blob.name,
            lastModified: blob.properties.lastModified?.toISOString() || '',
            size: blob.properties.contentLength || 0,
          });
        }
      }

      // Sort newest first
      blobs.sort((a, b) => (b.lastModified > a.lastModified ? 1 : -1));

      return {
        status: 200,
        jsonBody: {
          storageAccountName,
          containerName,
          prefix,
          count: blobs.length,
          blobs,
        },
      };
    } catch (error: any) {
      context.error('Storage list-blobs error:', error);

      // Provide user-friendly messages for common issues
      if (error.statusCode === 403) {
        return {
          status: 403,
          jsonBody: { error: 'Access denied. The SAS token may be expired, invalid, or lack List permission.' },
        };
      }
      if (error.statusCode === 404) {
        return {
          status: 404,
          jsonBody: { error: 'Container not found. Verify the storage account name and container name.' },
        };
      }

      return {
        status: 500,
        jsonBody: { error: `Failed to list blobs: ${error.message}` },
      };
    }
  },
});
