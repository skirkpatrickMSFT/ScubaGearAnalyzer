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
import { DefaultAzureCredential } from '@azure/identity';
import { detectAndParse, computeSummary, buildChatContext, buildProductBreakdown, extractExclusionContext, getControlExclusionNote, detectReportVersion, annotateBaselineStatus, PRODUCT_DISPLAY_NAMES } from '../shared/scubagear-parser.js';
import { compareToBaseline } from '../shared/baseline-changes.js';
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
      let sasToken = (body.sasToken || '').trim();

      if (!storageAccountName || !containerName || !blobName) {
        return {
          status: 400,
          jsonBody: {
            error: 'Missing required fields: storageAccountName, containerName, blobName',
          },
        };
      }

      let containerClient: ContainerClient;

      if (sasToken) {
        // SAS token auth
        if (!sasToken.startsWith('?')) {
          sasToken = '?' + sasToken;
        }
        const containerUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}${sasToken}`;
        containerClient = new ContainerClient(containerUrl);
      } else {
        // Managed Identity / DefaultAzureCredential auth
        const containerUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}`;
        containerClient = new ContainerClient(containerUrl, new DefaultAzureCredential());
      }
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
      annotateBaselineStatus(controls);
      const versionInfo = compareToBaseline(detectReportVersion(data));
      const exclusionContext = extractExclusionContext(data);
      const chatContext = buildChatContext(controls, exclusionContext, versionInfo);

      const productBreakdown = buildProductBreakdown(summary);

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
          source: `blob://${storageAccountName}/${containerName}/${blobName}`,
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
          chatContext,
          exclusionContext: exclusionContext ? JSON.stringify(exclusionContext) : null,
        },
      };
    } catch (error: any) {
      context.error('Storage fetch-blob error:', error);

      if (error.statusCode === 403) {
        return {
          status: 403,
          jsonBody: { error: 'Access denied. If using SAS, it may be expired or lack Read permission. If using Managed Identity, ensure the function app has Storage Blob Data Reader role on the storage account.' },
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
