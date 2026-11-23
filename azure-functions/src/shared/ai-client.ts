/**
 * Chat model client for the `chat` function.
 *
 * Supports two providers, chosen by `AI_PROVIDER`:
 *  - `openai` — OpenAI's API, authenticated with `OPENAI_API_KEY`.
 *  - `azure`  — Azure OpenAI / Azure AI Foundry. Authenticates with the function app's
 *               Managed Identity (or `az login` locally) via DefaultAzureCredential.
 *               `AZURE_OPENAI_API_KEY` is honoured as an optional fallback for local dev.
 *
 * When `AI_PROVIDER` is unset it is inferred: `azure` if `AZURE_OPENAI_ENDPOINT` is set,
 * otherwise `openai`, so existing OpenAI-only deployments keep working unchanged.
 */

import OpenAI, { AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';

export type AiProvider = 'openai' | 'azure';

type Env = Record<string, string | undefined>;

export interface ChatClient {
  client: OpenAI;
  /** Model name for OpenAI, deployment name for Azure OpenAI. */
  model: string;
  provider: AiProvider;
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o';
// GA API version that supports function calling.
const DEFAULT_AZURE_API_VERSION = '2024-10-21';

export function resolveAiProvider(env: Env = process.env): AiProvider {
  const explicit = (env.AI_PROVIDER ?? '').trim().toLowerCase();
  if (explicit === 'openai' || explicit === 'azure') return explicit;
  if (explicit) throw new Error(`AI_PROVIDER must be 'openai' or 'azure' (got '${explicit}').`);
  return env.AZURE_OPENAI_ENDPOINT?.trim() ? 'azure' : 'openai';
}

/** Entra token audience for the Azure cloud the endpoint belongs to. */
export function azureTokenScope(endpoint: string, env: Env = process.env): string {
  if (env.AZURE_OPENAI_TOKEN_SCOPE?.trim()) return env.AZURE_OPENAI_TOKEN_SCOPE.trim();
  const host = new URL(endpoint).hostname.toLowerCase();
  if (host.endsWith('.azure.us')) return 'https://cognitiveservices.azure.us/.default';
  if (host.endsWith('.azure.cn')) return 'https://cognitiveservices.azure.cn/.default';
  return 'https://cognitiveservices.azure.com/.default';
}

export function createChatClient(env: Env = process.env): ChatClient {
  const provider = resolveAiProvider(env);

  if (provider === 'openai') {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Set it, or set AI_PROVIDER=azure with AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT to use Azure OpenAI.',
      );
    }
    return {
      client: new OpenAI({ apiKey }),
      model: env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
      provider,
    };
  }

  const endpoint = env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/+$/, '');
  const deployment = env.AZURE_OPENAI_DEPLOYMENT?.trim();
  if (!endpoint || !deployment) {
    throw new Error(
      'Azure OpenAI requires AZURE_OPENAI_ENDPOINT (e.g. https://<resource>.openai.azure.com) and AZURE_OPENAI_DEPLOYMENT (the model deployment name).',
    );
  }

  const apiVersion = env.AZURE_OPENAI_API_VERSION?.trim() || DEFAULT_AZURE_API_VERSION;
  const apiKey = env.AZURE_OPENAI_API_KEY?.trim();

  const client = apiKey
    ? new AzureOpenAI({ endpoint, deployment, apiVersion, apiKey })
    : new AzureOpenAI({
        endpoint,
        deployment,
        apiVersion,
        azureADTokenProvider: getBearerTokenProvider(new DefaultAzureCredential(), azureTokenScope(endpoint, env)),
      });

  return { client, model: deployment, provider };
}

let cached: ChatClient | null = null;

/** Lazily creates and reuses the client so credential/token caching survives across requests. */
export function getChatClient(): ChatClient {
  if (!cached) cached = createChatClient();
  return cached;
}
