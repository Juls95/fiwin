import { chatCompletion } from "@/lib/agent/model0g";
import { SYSTEM_PROMPT, followUpPrompt, ALLOWED_TOOLS } from "@/lib/agent/prompts";
import { toolRegistry, isAllowedTool } from "@/lib/tools/toolRegistry";

/**
 * Agent orchestrator.
 *
 * Contract:
 *   1. Pre-filter obvious unsupported intents (delete, raw keys, etc.) before
 *      paying for a model round-trip.
 *   2. Call 0G Compute with JSON-mode, parse { action, tool, args, reply, reason }.
 *   3. If action="tool": validate name against ALLOWED_TOOLS, Zod-parse args
 *      against the tool's schema, run the handler, then ask 0G Compute to
 *      phrase the result in English.
 *   4. If action="refuse" or "reply": pass through unchanged.
 *
 * Never executes a tool whose name isn't in the registry. Never exposes
 * the registry or keys to the model.
 */

const REFUSAL_PATTERNS: Array<{ re: RegExp; why: string }> = [
  { re: /\b(delete|remove|erase|drop)\b.*\b(client|record|data|message|history)\b/i, why: "deletes_not_supported" },
  { re: /\b(private[\s-]?key|encryption key|storage key|api key|bot token)\b/i, why: "keys_not_available" },
  { re: /\b(raw storage|0g key|stream id|merkle root|read[-\s]?key)\b/i, why: "raw_storage_not_exposed" },
  { re: /\b(mock|seed|demoDatabase|local data)\b/i, why: "local_data_not_used_at_runtime" },
  { re: /\bremind\s?me\b|\breminder\b/i, why: "reminders_out_of_scope" }
];

export interface OrchestratorResult {
  reply: string;
  refused?: boolean;
  toolUsed?: string;
}

interface ModelEnvelope {
  action: "tool" | "reply" | "refuse";
  tool?: string;
  args?: unknown;
  reply?: string;
  reason?: string;
}

function tryParseJson(text: string): ModelEnvelope | null {
  try {
    return JSON.parse(text) as ModelEnvelope;
  } catch {
    // Try to extract the first JSON object if the model wrapped it in prose.
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as ModelEnvelope;
    } catch {
      return null;
    }
  }
}

export async function runAgent(params: {
  chatId: number;
  userMessage: string;
}): Promise<OrchestratorResult> {
  const { userMessage } = params;

  // 1. Cheap pre-filter. Rejects land before any 0G Compute spend.
  for (const { re, why } of REFUSAL_PATTERNS) {
    if (re.test(userMessage)) {
      return {
        reply:
          "I can't do that. I can only list, get, create, update, and summarize clients, or recall today's conversation.",
        refused: true,
        toolUsed: why
      };
    }
  }

  // 2. First model turn — ask for an action envelope.
  const first = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ]
  });
  const env = tryParseJson(first.content);
  if (!env) {
    return {
      reply:
        "I couldn't understand how to help with that. Try asking to list, get, create, update, or summarize a client.",
      refused: true
    };
  }

  if (env.action === "refuse") {
    return { reply: env.reply ?? "Request refused.", refused: true };
  }
  if (env.action === "reply") {
    return { reply: env.reply ?? "" };
  }
  if (env.action !== "tool" || !env.tool) {
    return {
      reply: "I couldn't choose a supported action for that request.",
      refused: true
    };
  }

  // 3. Tool gate: name must be in the registry.
  if (!isAllowedTool(env.tool) || !ALLOWED_TOOLS.includes(env.tool)) {
    return {
      reply: `The tool '${env.tool}' is not available.`,
      refused: true
    };
  }
  const def = toolRegistry[env.tool];

  const parsed = def.inputSchema.safeParse(env.args ?? {});
  if (!parsed.success) {
    return {
      reply: `Invalid arguments for ${env.tool}.`,
      refused: true
    };
  }

  let result: unknown;
  try {
    result = await def.handler(parsed.data);
  } catch (err) {
    return {
      reply: `The ${env.tool} tool failed: ${(err as Error).message.slice(0, 200)}`,
      toolUsed: env.tool
    };
  }

  // 4. Second model turn — phrase the result in English.
  const second = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
      { role: "assistant", content: JSON.stringify(env) },
      {
        role: "user",
        content: followUpPrompt(env.tool, JSON.stringify(parsed.data), JSON.stringify(result))
      }
    ]
  });
  const phrased = tryParseJson(second.content);
  const replyText =
    phrased?.reply ??
    (typeof second.content === "string" && second.content.length > 0
      ? second.content
      : `Done. (${env.tool})`);

  return { reply: replyText, toolUsed: env.tool };
}
