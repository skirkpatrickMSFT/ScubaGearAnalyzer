import { test } from 'node:test';
import assert from 'node:assert/strict';

import { azureTokenScope, createChatClient, resolveAiProvider } from '../dist/src/shared/ai-client.js';

const azureEnv = {
  AI_PROVIDER: 'azure',
  AZURE_OPENAI_ENDPOINT: 'https://contoso.openai.azure.com/',
  AZURE_OPENAI_DEPLOYMENT: 'gpt-4o-chat',
};

test('provider defaults to openai and is inferred from the Azure endpoint', () => {
  assert.equal(resolveAiProvider({}), 'openai');
  assert.equal(resolveAiProvider({ AZURE_OPENAI_ENDPOINT: 'https://x.openai.azure.com' }), 'azure');
  assert.equal(resolveAiProvider({ AI_PROVIDER: 'AZURE' }), 'azure');
  assert.equal(
    resolveAiProvider({ AI_PROVIDER: 'openai', AZURE_OPENAI_ENDPOINT: 'https://x.openai.azure.com' }),
    'openai',
    'an explicit provider wins over inference',
  );
  assert.throws(() => resolveAiProvider({ AI_PROVIDER: 'bedrock' }), /AI_PROVIDER must be/);
});

test('openai provider requires a key and honours the model override', () => {
  assert.throws(() => createChatClient({}), /OPENAI_API_KEY is not set/);

  const c = createChatClient({ OPENAI_API_KEY: 'sk-test' });
  assert.equal(c.provider, 'openai');
  assert.equal(c.model, 'gpt-4o');
  assert.equal(createChatClient({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-4.1' }).model, 'gpt-4.1');
});

test('azure provider requires an endpoint and a deployment', () => {
  assert.throws(() => createChatClient({ AI_PROVIDER: 'azure' }), /AZURE_OPENAI_ENDPOINT/);
  assert.throws(
    () => createChatClient({ AI_PROVIDER: 'azure', AZURE_OPENAI_ENDPOINT: 'https://x.openai.azure.com' }),
    /AZURE_OPENAI_DEPLOYMENT/,
  );
});

test('azure provider targets the deployment and uses it as the model', () => {
  // The endpoint in azureEnv has a trailing slash, which must not produce "//openai".
  const c = createChatClient({ ...azureEnv, AZURE_OPENAI_API_KEY: 'local-dev-key' });
  assert.equal(c.provider, 'azure');
  assert.equal(c.model, 'gpt-4o-chat');
  assert.equal(c.client.baseURL, 'https://contoso.openai.azure.com/openai');
});

test('azure provider uses Entra ID (no key) when none is configured', () => {
  // Creating the client must not require a key or reach the network.
  const c = createChatClient(azureEnv);
  assert.equal(c.provider, 'azure');
  assert.equal(c.client.apiKey, '<Missing Key>', 'token provider is used instead of a static key');
});

test('token scope follows the Azure cloud of the endpoint', () => {
  assert.equal(azureTokenScope('https://a.openai.azure.com'), 'https://cognitiveservices.azure.com/.default');
  assert.equal(azureTokenScope('https://a.services.ai.azure.com'), 'https://cognitiveservices.azure.com/.default');
  assert.equal(azureTokenScope('https://a.openai.azure.us'), 'https://cognitiveservices.azure.us/.default');
  assert.equal(azureTokenScope('https://a.openai.azure.cn'), 'https://cognitiveservices.azure.cn/.default');
  assert.equal(
    azureTokenScope('https://a.openai.azure.com', { AZURE_OPENAI_TOKEN_SCOPE: 'custom/.default' }),
    'custom/.default',
  );
});
