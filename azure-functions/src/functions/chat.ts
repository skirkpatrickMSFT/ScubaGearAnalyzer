/**
 * Azure Function: chat
 * 
 * POST /api/chat
 * Body: { message: string, assessmentContext?: string, history?: ChatMessage[] }
 * 
 * LLM-powered chat using OpenAI GPT-4o with function-calling.
 * Grounded on ScubaGear baseline data and Microsoft Learn documentation.
 * This is the primary endpoint consumed by the Power Apps chat screen
 * (and optionally the Copilot Studio agent).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import OpenAI from 'openai';
import { getControlById, searchControls, getControlsBySection, AAD_SECTIONS, HIGHLY_PRIVILEGED_ROLES } from '../shared/baseline-data.js';
import { searchLearn, fetchArticle, getLearnUrlsForControl, getSearchQueryForTopic } from '../shared/learn-fetcher.js';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/index';

// ── OpenAI client ───────────────────────────────────────────
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── System prompt ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are **ScubaGear Analyzer**, a CISA ScubaGear compliance assistant.
You help security teams understand, analyse, and remediate the baseline controls defined by CISA for Microsoft 365.

You have access to exactly two back-end knowledge sources:
1. **ScubaGear Baseline** — static policy data from the official CISA ScubaGear repository: control descriptions, remediation steps, NIST/MITRE mappings, and implementation guidance.
2. **Microsoft Learn** — official Microsoft documentation for Entra ID, Defender, Exchange Online, SharePoint, Teams, and Power Platform configuration.

You do NOT have live access to the user's tenant. All tenant-specific data comes from the uploaded ScubaGear TestResults.json which is provided as context below.

### Control ID resolution
Users may refer to controls in shorthand:
- "entra 3.1" or "aad 3.1" → MS.AAD.3.1v1
- "defender 1.4" → MS.DEFENDER.1.4v1
- "exo 4.3" → MS.EXO.4.3v1
- "sharepoint 1.1" → MS.SHAREPOINT.1.1v1
- "teams 2.1" → MS.TEAMS.2.1v2
- "powerplatform 1.1" → MS.POWERPLATFORM.1.1v1
Always normalise to the full MS.PRODUCT.X.Xv1 format before passing to any tool.

### Response guidelines
- Always ground your answers in either ScubaGear Baseline data or Microsoft Learn documentation.
- When discussing a failing control, first explain what the control requires, then explain why it failed, then provide remediation steps.
- Format responses in Markdown. Use headings, bullet lists, and tables.
- Be concise but thorough.
- When showing remediation steps, include specific navigation paths in the Microsoft admin portals.`;

// ── Tool definitions ────────────────────────────────────────
const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'baseline_get_control_info',
      description: 'Get detailed information about a specific CISA ScubaGear baseline control.',
      parameters: {
        type: 'object',
        properties: { controlId: { type: 'string', description: 'The control ID, e.g. MS.AAD.1.1v1' } },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_list_controls',
      description: 'List all CISA ScubaGear AAD baseline controls. Optionally filter by section number (1-8).',
      parameters: {
        type: 'object',
        properties: { sectionNumber: { type: 'number', description: 'Optional section number 1-8' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_remediation_steps',
      description: 'Get step-by-step remediation instructions for a specific control.',
      parameters: {
        type: 'object',
        properties: { controlId: { type: 'string', description: 'The control ID, e.g. MS.AAD.3.1v1' } },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_search',
      description: "Search the AAD baseline for controls matching a keyword (e.g. 'MFA', 'guest').",
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search term' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_section_summary',
      description: 'Get a summary of a specific AAD baseline section (1-8).',
      parameters: {
        type: 'object',
        properties: { sectionNumber: { type: 'number', description: 'Section number (1-8)' } },
        required: ['sectionNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'baseline_get_highly_privileged_roles',
      description: 'Get the list of roles CISA considers highly privileged.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_search',
      description: 'Search Microsoft Learn for documentation articles.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Max results (default 5, max 10)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_get_control_docs',
      description: 'Get Microsoft Learn docs mapped to a ScubaGear control.',
      parameters: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'Control ID' },
          fetchContent: { type: 'boolean', description: 'Fetch full content (default false)' },
        },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_get_article_content',
      description: 'Fetch the content of a specific Microsoft Learn article.',
      parameters: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Full Learn article URL' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_get_implementation_guide',
      description: 'Get a comprehensive implementation guide for a ScubaGear control from Learn docs.',
      parameters: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'Control ID' },
          topic: { type: 'string', description: 'Additional topic context' },
        },
        required: ['controlId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'learn_search_entra_topic',
      description: 'Search Microsoft Learn for Entra ID-specific documentation on a topic.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to search for' },
          maxResults: { type: 'number', description: 'Max results (default 5, max 10)' },
        },
        required: ['topic'],
      },
    },
  },
];

// ── Tool dispatcher (calls local functions instead of MCP) ──
async function dispatchToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'baseline_get_control_info': {
        const control = getControlById(args.controlId as string);
        if (!control) return `Control '${args.controlId}' not found.`;
        return JSON.stringify(control, null, 2);
      }
      case 'baseline_list_controls': {
        const sectionNumber = args.sectionNumber as number | undefined;
        const controls = sectionNumber ? getControlsBySection(sectionNumber) : (await import('../shared/baseline-data.js')).ALL_BASELINE_CONTROLS;
        return controls.map((c) => `- **${c.id}** [${c.criticality}] ${c.title}`).join('\n');
      }
      case 'baseline_get_remediation_steps': {
        const control = getControlById(args.controlId as string);
        if (!control) return `Control '${args.controlId}' not found.`;
        return `# Remediation for ${control.id}\n\n**${control.title}**\n\n## Why This Matters\n${control.rationale}\n\n## Implementation Steps\n${control.implementation}\n\n## License Requirements\n${control.licenseRequirements}\n\n## Resources\n${control.resources.map((r) => `- ${r}`).join('\n')}`;
      }
      case 'baseline_search': {
        const results = searchControls(args.query as string);
        if (results.length === 0) return `No controls found matching '${args.query}'.`;
        return results.map((c) => `### ${c.id} [${c.criticality}]\n**${c.title}**\n${c.description}`).join('\n\n');
      }
      case 'baseline_get_section_summary': {
        const sn = args.sectionNumber as number;
        const sName = AAD_SECTIONS[sn];
        if (!sName) return 'Invalid section number.';
        const ctrls = getControlsBySection(sn);
        let text = `# Section ${sn}: ${sName}\n\nTotal: ${ctrls.length} controls\n\n`;
        for (const c of ctrls) {
          text += `- **${c.id}** [${c.criticality}] ${c.title} (${c.checkType})\n`;
        }
        if (sn === 7) text += `\nHighly Privileged Roles: ${HIGHLY_PRIVILEGED_ROLES.join(', ')}`;
        return text;
      }
      case 'baseline_get_highly_privileged_roles':
        return `CISA Highly Privileged Roles:\n${HIGHLY_PRIVILEGED_ROLES.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

      case 'learn_search': {
        const learnResults = await searchLearn(args.query as string, (args.maxResults as number) || 5);
        if (learnResults.length === 0) return `No Learn articles found for: "${args.query}"`;
        return learnResults.map((r, i) => `${i + 1}. **${r.title}**\n${r.description}\nURL: ${r.url}`).join('\n\n');
      }
      case 'learn_get_control_docs': {
        const urls = getLearnUrlsForControl(args.controlId as string);
        if (urls.length === 0) return `No mapped docs for ${args.controlId}. Try learn_search.`;
        if (args.fetchContent) {
          const articles = await Promise.all(urls.map((u) => fetchArticle(u)));
          return articles.filter(Boolean).map((a) => `## ${a!.title}\n${a!.content}`).join('\n\n---\n\n');
        }
        return `Documentation for ${args.controlId}:\n${urls.map((u) => `- ${u}`).join('\n')}`;
      }
      case 'learn_get_article_content': {
        const article = await fetchArticle(args.url as string);
        if (!article) return `Could not fetch article at: ${args.url}`;
        return `# ${article.title}\n\n${article.content}`;
      }
      case 'learn_get_implementation_guide': {
        const urls = getLearnUrlsForControl(args.controlId as string);
        let output = `# Implementation Guide: ${args.controlId}\n\n`;
        if (urls.length > 0) {
          const primary = await fetchArticle(urls[0]);
          if (primary) output += `## ${primary.title}\n${primary.content}\n\n`;
          if (urls.length > 1) output += `Additional: ${urls.slice(1).join(', ')}\n\n`;
        }
        if (args.topic) {
          const sr = await searchLearn(getSearchQueryForTopic(args.topic as string), 3);
          if (sr.length > 0) output += `## Related: "${args.topic}"\n${sr.map((r) => `- [${r.title}](${r.url})`).join('\n')}`;
        }
        return output;
      }
      case 'learn_search_entra_topic': {
        const optimized = getSearchQueryForTopic(args.topic as string);
        const results = await searchLearn(optimized, (args.maxResults as number) || 5);
        if (results.length === 0) return `No Entra ID docs found for: "${args.topic}"`;
        return results.map((r, i) => `${i + 1}. **${r.title}**\n${r.description}\nURL: ${r.url}`).join('\n\n');
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Error calling ${name}: ${err.message}`;
  }
}

// ── Constants ───────────────────────────────────────────────
const MAX_TOOL_ROUNDS = 6;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 100_000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 60_000;

app.http('chat', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'chat',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = (await request.json()) as {
        message?: string;
        assessmentContext?: string;
        history?: Array<{ role: string; content: string }>;
      };

      const { message, assessmentContext, history } = body;

      if (!message || typeof message !== 'string') {
        return { status: 400, jsonBody: { error: 'message field is required' } };
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        return { status: 400, jsonBody: { error: `Message too long. Max ${MAX_MESSAGE_LENGTH} chars.` } };
      }

      const safeContext = typeof assessmentContext === 'string'
        ? assessmentContext.slice(0, MAX_CONTEXT_LENGTH)
        : undefined;

      // Build conversation
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      if (safeContext) {
        messages.push({
          role: 'system',
          content: `The user has uploaded their ScubaGear assessment results:\n\n${safeContext}`,
        });
      } else {
        messages.push({
          role: 'system',
          content: 'No ScubaGear assessment uploaded yet. Answer general baseline questions.',
        });
      }

      // Inject history
      if (Array.isArray(history) && history.length > 0) {
        const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
        let charBudget = MAX_HISTORY_CHARS;
        for (const msg of trimmed) {
          if (msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')) {
            const text = msg.content.slice(0, 4000);
            if (charBudget - text.length < 0) break;
            charBudget -= text.length;
            messages.push({ role: msg.role, content: text });
          }
        }
      }

      messages.push({ role: 'user', content: message });

      // Agentic loop
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.2,
        });

        const choice = completion.choices[0];
        const assistantMessage = choice.message;
        messages.push(assistantMessage);

        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          return {
            status: 200,
            jsonBody: {
              response: assistantMessage.content || 'No response generated.',
              timestamp: new Date().toISOString(),
            },
          };
        }

        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (toolCall) => {
            if (toolCall.type !== 'function') {
              return { role: 'tool' as const, tool_call_id: toolCall.id, content: 'Unsupported tool type' };
            }
            const args = JSON.parse(toolCall.function.arguments);
            const result = await dispatchToolCall(toolCall.function.name, args);
            return { role: 'tool' as const, tool_call_id: toolCall.id, content: result };
          })
        );

        messages.push(...toolResults);
      }

      // Exhausted loop
      messages.push({ role: 'user', content: 'Provide your best answer with the information gathered.' });
      const finalCompletion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.2,
      });

      return {
        status: 200,
        jsonBody: {
          response: finalCompletion.choices[0].message.content || 'No response generated.',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      context.error('Chat function error:', error);
      return {
        status: 500,
        jsonBody: { error: error.message, response: `Error: ${error.message}` },
      };
    }
  },
});
