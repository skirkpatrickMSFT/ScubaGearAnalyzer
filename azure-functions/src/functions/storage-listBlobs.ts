/**
 * Azure Function: storage-listBlobs
 *
 * GET /api/storage/list-blobs
 * Query params:
 *   - storageAccountName: Azure Storage account name
 *   - containerName: Blob container name
 *   - sasToken: (optional) Shared Access Signature token. If omitted, uses Managed Identity.
 *   - prefix: (optional) Blob name prefix filter (e.g. "2026/02/")
 *
 * Lists blobs in a ScubaConnect output container so users can
 * browse ScubaGear result files and pick one to load.
 *
 * Authentication:
 *   1. If sasToken is provided → SAS-based auth (existing behaviour)
 *   2. If sasToken is omitted  → DefaultAzureCredential (Managed Identity / az login)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ContainerClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

app.http('storage-listBlobs', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'storage/list-blobs',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const storageAccountName = request.query.get('storageAccountName');
      const containerName = request.query.get('containerName');
      let sasToken = (request.query.get('sasToken') || '').trim();
      const prefix = request.query.get('prefix') || '';

      if (!storageAccountName || !containerName) {
        return {
          status: 400,
          jsonBody: {
            error: 'Missing required query parameters: storageAccountName, containerName',
          },
        };
      }

      let containerClient: ContainerClient;
      let authMethod: string;

      if (sasToken) {
        // SAS token auth
        if (!sasToken.startsWith('?')) {
          sasToken = '?' + sasToken;
        }
        const containerUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}${sasToken}`;
        containerClient = new ContainerClient(containerUrl);
        authMethod = 'sas';
      } else {
        // Managed Identity / DefaultAzureCredential auth
        const containerUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}`;
        containerClient = new ContainerClient(containerUrl, new DefaultAzureCredential());
        authMethod = 'managed-identity';
      }

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
          authMethod,
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
          jsonBody: { error: 'Access denied. If using SAS, it may be expired or lack List permission. If using Managed Identity, ensure the function app has Storage Blob Data Reader role on the storage account.' },
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
