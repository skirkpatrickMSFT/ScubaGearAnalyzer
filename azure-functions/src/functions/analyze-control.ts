/**
 * Azure Function: analyze-control
 *
 * POST /api/analyze-control
 * Body: { controlId: string, reportDetails: string, status: string }
 *
 * Uses GPT-4o to perform root-cause analysis on a specific ScubaGear
 * control result.  Combines the raw scan output (reportDetails) with
 * the official CISA baseline requirement to produce:
 *   - A plain-English explanation of WHY the control passed / failed
 *   - Specific findings extracted from the scan data (users, groups,
 *     policies, settings that caused the result)
 *   - Targeted remediation steps (not generic — tied to the findings)
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import OpenAI from "openai";
import { getControlById } from "../shared/baseline-data.js";

// ── OpenAI client (reused across invocations) ───────────────
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── System prompt ───────────────────────────────────────────
const ANALYSIS_SYSTEM_PROMPT = `You are **ScubaGear Analyzer**, an expert at interpreting CISA ScubaGear compliance scan results for Microsoft 365.

You will receive:
1. **Baseline requirement** — the official CISA control definition (what SHOULD or SHALL be true).
2. **Scan result** — the raw output from a ScubaGear scan for a specific control, including its status (Pass/Fail/etc.) and report details.

Your job is to produce a **root-cause analysis** that explains:

### For FAILING controls
- **What was expected** — briefly restate the requirement.
- **What the scan found** — extract specific items from the report details: user names, group names, policy names, setting values, excluded accounts, missing configurations, etc.
- **Why it failed** — connect the findings to the requirement in plain English.
- **Targeted remediation** — step-by-step instructions that address the SPECIFIC findings (not generic steps). Reference the exact users/groups/policies found in the scan.

### For PASSING controls
- Briefly confirm what the scan verified and why it passes.

### For Manual / Not-Implemented controls
- Explain what needs to be manually verified and how.

### Formatting rules
- Use Markdown with headers, bullet lists, and bold for key items.
- When listing users/groups/policies from the scan, format them in a bulleted list or table.
- Be concise — aim for 150-300 words.
- Do NOT fabricate findings. Only reference data present in the scan result.`;

app.http("analyze-control", {
  methods: ["POST"],
  authLevel: "function",
  route: "analyze-control",
  handler: async (
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await request.json()) as {
        controlId?: string;
        reportDetails?: string;
        status?: string;
      };

      const { controlId, reportDetails, status } = body;

      // ── Validate inputs ─────────────────────────────────
      if (!controlId || typeof controlId !== "string") {
        return {
          status: 400,
          jsonBody: { error: "controlId is required" },
        };
      }

      if (
        !/^MS\.[A-Z]{2,15}\.\d{1,3}\.\d{1,3}v\d{1,2}$/.test(controlId)
      ) {
        return {
          status: 400,
          jsonBody: { error: "Invalid controlId format. Expected: MS.AAD.1.1v1" },
        };
      }

      if (!reportDetails || typeof reportDetails !== "string") {
        return {
          status: 400,
          jsonBody: { error: "reportDetails is required" },
        };
      }

      // ── Build context ───────────────────────────────────
      const baseline = getControlById(controlId);

      let requirementContext: string;
      if (baseline) {
        requirementContext = [
          `## CISA Baseline Requirement: ${baseline.id}`,
          `**Section:** ${baseline.sectionNumber}. ${baseline.section}`,
          `**Title:** ${baseline.title}`,
          `**Criticality:** ${baseline.criticality}`,
          `**Check Type:** ${baseline.checkType}`,
          `**Description:** ${baseline.description}`,
          `**Rationale:** ${baseline.rationale}`,
          `**Implementation guidance:**\n${baseline.implementation}`,
          baseline.notes.length > 0
            ? `**Notes:** ${baseline.notes.join("; ")}`
            : "",
          `**NIST:** ${baseline.nistMapping.join(", ")}`,
          `**MITRE:** ${baseline.mitreMapping.join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        requirementContext = `Control ${controlId} — no baseline definition found. Analyse the scan output on its own.`;
      }

      const scanContext = [
        `## Scan Result for ${controlId}`,
        `**Status:** ${status || "Unknown"}`,
        `**Report Details:**`,
        reportDetails.slice(0, 6000),
      ].join("\n");

      // ── Call GPT-4o ─────────────────────────────────────
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        temperature: 0.15,
        max_tokens: 1500,
        messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${requirementContext}\n\n---\n\n${scanContext}\n\nPlease analyse this result.`,
          },
        ],
      });

      const analysis =
        completion.choices[0]?.message?.content || "Unable to generate analysis.";

      return {
        status: 200,
        jsonBody: {
          controlId,
          status: status || "Unknown",
          analysis,
          hasBaseline: !!baseline,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      context.error("analyze-control error:", error);
      return {
        status: 500,
        jsonBody: {
          error: error.message,
          analysis: `Error generating analysis: ${error.message}`,
        },
      };
    }
  },
});
