/**
 * Azure Function: storage-fetchBlob
 *
 * POST /api/storage/fetch-blob
 * Body: { storageAccountName, containerName, sasToken, blobName }
 *
 * Fetches a ScubaGear JSON result file from Azure Blob Storage,
 * parses it through the same pipeline as parse-results, and returns
 * structured compliance data. This lets users load results directly
 * from a ScubaConnect output container.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ContainerClient } from '@azure/storage-blob';
import { detectAndParse, computeSummary, buildChatContext, PRODUCT_DISPLAY_NAMES } from '../shared/scubagear-parser.js';
import type { ScubaProduct } from '../shared/types.js';

app.http('storage-fetchBlob', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'storage/fetch-blob',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = (await request.json()) as {
        storageAccountName?: string;
        containerName?: string;
        sasToken?: string;
        blobName?: string;
      };

      const { storageAccountName, containerName, blobName } = body;
      let sasToken = body.sasToken;

      if (!storageAccountName || !containerName || !sasToken || !blobName) {
        return {
          status: 400,
          jsonBody: {
            error: 'Missing required fields: storageAccountName, containerName, sasToken, blobName',
          },
        };
      }

      // Normalize SAS token
      if (!sasToken.startsWith('?')) {
        sasToken = '?' + sasToken;
      }

      const containerUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}${sasToken}`;
      const containerClient = new ContainerClient(containerUrl);
      const blobClient = containerClient.getBlobClient(blobName);

      // Download blob content
      const downloadResponse = await blobClient.download(0);
      const downloaded = await streamToString(downloadResponse.readableStreamBody!);

      // Strip BOM if present (common with PowerShell-generated files)
      const cleaned = downloaded.replace(/^\uFEFF/, '');
      const data = JSON.parse(cleaned);

      // Parse through the same pipeline as parse-results
      const { controls, format } = detectAndParse(data);

      if (controls.length === 0) {
        return {
          status: 400,
          jsonBody: {
            error: `Could not parse any controls from '${blobName}'. Ensure it is a valid ScubaGear results JSON file.`,
          },
        };
      }

      const summary = computeSummary(controls);
      const chatContext = buildChatContext(controls);

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
      }));

      return {
        status: 200,
        jsonBody: {
          source: `blob://${storageAccountName}/${containerName}/${blobName}`,
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
          chatContext,
        },
      };
    } catch (error: any) {
      context.error('Storage fetch-blob error:', error);

      if (error.statusCode === 403) {
        return {
          status: 403,
          jsonBody: { error: 'Access denied. The SAS token may be expired, invalid, or lack Read permission.' },
        };
      }
      if (error.statusCode === 404) {
        return {
          status: 404,
          jsonBody: { error: 'Blob not found. Verify the blob name, storage account, and container.' },
        };
      }

      return {
        status: 500,
        jsonBody: { error: `Failed to fetch blob: ${error.message}` },
      };
    }
  },
});

/**
 * Reads a Node.js readable stream into a string.
 */
async function streamToString(readable: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}
