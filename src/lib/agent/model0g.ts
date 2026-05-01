import { Wallet, JsonRpcProvider } from "ethers";
import {
  createZGComputeNetworkBroker,
  type ZGComputeNetworkBroker
} from "@0glabs/0g-serving-broker";
import { getEnv } from "@/lib/config/env";

/**
 * 0G Compute — the ONLY inference path for the MVP.
 *
 * No OpenAI / Gemini / Anthropic fallbacks. If 0G Compute is down, the
 * caller MUST surface the failure, not silently route elsewhere.
 *
 * Flow (per @0glabs/0g-serving-broker docs):
 *   1. Build a ledger + inference broker bound to our wallet.
 *   2. getServiceMetadata(provider) → { endpoint, model }
 *   3. getRequestHeaders(provider, content) → signed billing headers
 *   4. POST to {endpoint}/chat/completions (OpenAI-compatible) with headers
 *   5. broker.inference.responseProcessor.processResponse(...) for settlement
 */

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export interface ChatCompletionOptions {
  messages: ChatMsg[];
  /** Force JSON output when we expect a tool-call envelope from the model. */
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult {
  content: string;
  chatId?: string;
  raw?: unknown;
}

let broker: ZGComputeNetworkBroker | null = null;
let wallet: Wallet | null = null;

async function getBroker(): Promise<ZGComputeNetworkBroker> {
  if (broker) return broker;
  const env = getEnv();
  const provider = new JsonRpcProvider(env.ZEROG_COMPUTE_RPC_URL);
  wallet = new Wallet(env.ZEROG_PRIVATE_KEY, provider);
  broker = await createZGComputeNetworkBroker(wallet as never);
  return broker;
}

async function getEndpointAndModel(): Promise<{ endpoint: string; model: string }> {
  const b = await getBroker();
  const providerAddr = getEnv().ZEROG_COMPUTE_PROVIDER_ADDRESS;
  // Ensure TEE signer is acknowledged. Idempotent — no-op if already done.
  try {
    const ack = await b.inference.acknowledged(providerAddr);
    if (!ack) {
      await b.inference.acknowledgeProviderSigner(providerAddr);
    }
  } catch {
    // Best effort; many providers will still serve requests without it.
  }
  return b.inference.getServiceMetadata(providerAddr);
}

export async function chatCompletion(
  opts: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const b = await getBroker();
  const env = getEnv();
  const providerAddr = env.ZEROG_COMPUTE_PROVIDER_ADDRESS;

  const { endpoint, model } = await getEndpointAndModel();
  const content = opts.messages.map((m) => `${m.role}:${m.content}`).join("\n");
  const headers = await b.inference.getRequestHeaders(providerAddr, content);

  const body: Record<string, unknown> = {
    model: env.ZEROG_COMPUTE_MODEL || model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 512
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const url = `${endpoint.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(headers as unknown as Record<string, string>)
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`[0g-compute] ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    id?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = json.choices?.[0]?.message?.content ?? "";

  // Fire-and-forget settlement. We still return the content even if this fails.
  try {
    await b.inference.responseProcessor.processResponse(providerAddr, json.id, out);
  } catch {
    // ignore — non-fatal for the caller
  }

  return { content: out, chatId: json.id, raw: json };
}

/** Health check: tiny round-trip to 0G Compute. */
export async function computeHealthCheck(): Promise<void> {
  const r = await chatCompletion({
    messages: [
      { role: "system", content: "Reply with the single word OK." },
      { role: "user", content: "ping" }
    ],
    maxTokens: 8,
    temperature: 0
  });
  if (!r.content || r.content.length === 0) {
    throw new Error("[0g-compute] empty health response");
  }
}

export function __resetComputeClients(): void {
  broker = null;
  wallet = null;
}
