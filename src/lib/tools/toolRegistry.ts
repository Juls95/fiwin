import { z } from "zod";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  summarizeClient
} from "@/lib/tools/clientTools";
import { recallConversation } from "@/lib/tools/memoryTools";
import {
  ListClientsInputSchema,
  GetClientInputSchema,
  CreateClientInputSchema,
  UpdateClientInputSchema,
  SummarizeClientInputSchema,
  RecallConversationInputSchema
} from "@/lib/validation/schemas";
import { ALLOWED_TOOLS, type AllowedTool } from "@/lib/agent/prompts";

/**
 * Single source of truth for every tool the agent may invoke.
 *
 * The registry is the hard boundary:
 *   - Keys MUST exactly match ALLOWED_TOOLS (checked at module load).
 *   - Every tool has a Zod input schema; the orchestrator parses args
 *     through this schema before any handler runs.
 *   - Handlers receive parsed, typed input and nothing else. No raw
 *     storage primitives, no keys, no env access.
 */

export interface ToolDefinition<I, O> {
  name: AllowedTool;
  description: string;
  inputSchema: z.ZodType<I>;
  handler: (input: I) => Promise<O>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyToolDefinition = ToolDefinition<any, any>;

export const toolRegistry: Record<AllowedTool, AnyToolDefinition> = {
  listClients: {
    name: "listClients",
    description: "List all clients in the demo workspace.",
    inputSchema: ListClientsInputSchema,
    handler: (i) => listClients(i)
  },
  getClient: {
    name: "getClient",
    description: "Get one client by idCliente (e.g. CLT-0001).",
    inputSchema: GetClientInputSchema,
    handler: (i) => getClient(i)
  },
  createClient: {
    name: "createClient",
    description: "Create a new client. All domain fields required.",
    inputSchema: CreateClientInputSchema,
    handler: (i) => createClient(i)
  },
  updateClient: {
    name: "updateClient",
    description: "Patch allowed fields on a client by idCliente.",
    inputSchema: UpdateClientInputSchema,
    handler: (i) => updateClient(i)
  },
  summarizeClient: {
    name: "summarizeClient",
    description:
      "Produce an English summary of a client using 0G Compute after reading the record from 0G.",
    inputSchema: SummarizeClientInputSchema,
    handler: (i) => summarizeClient(i)
  },
  recallConversation: {
    name: "recallConversation",
    description:
      "Recall what was discussed in a Telegram chat on a given date (default: today).",
    inputSchema: RecallConversationInputSchema,
    handler: (i) => recallConversation(i)
  }
};

// Compile-time + runtime guards: the registry must match ALLOWED_TOOLS exactly.
{
  const registered = new Set(Object.keys(toolRegistry));
  const allowed = new Set<string>(ALLOWED_TOOLS);
  if (registered.size !== allowed.size) {
    throw new Error(
      `[toolRegistry] size mismatch: registered=${registered.size} allowed=${allowed.size}`
    );
  }
  for (const t of ALLOWED_TOOLS) {
    if (!registered.has(t)) throw new Error(`[toolRegistry] missing '${t}'`);
  }
}

export function isAllowedTool(name: string): name is AllowedTool {
  return (ALLOWED_TOOLS as readonly string[]).includes(name);
}

export function listToolSchemas(): Array<{
  name: AllowedTool;
  description: string;
}> {
  return (Object.values(toolRegistry) as AnyToolDefinition[]).map((t) => ({
    name: t.name,
    description: t.description
  }));
}
