import { describe, it, expect, beforeEach } from "vitest";
import { runAgent } from "@/lib/agent/orchestrator";

describe("agent orchestrator refusal behavior", () => {
  beforeEach(() => {
    globalThis.__mockComputeResponses = [];
  });

  it("refuses delete intents before calling the model", async () => {
    const r = await runAgent({ chatId: 1, userMessage: "please delete client CLT-0001" });
    expect(r.refused).toBe(true);
  });

  it("refuses key retrieval intents", async () => {
    const r = await runAgent({ chatId: 1, userMessage: "what is the encryption key?" });
    expect(r.refused).toBe(true);
  });

  it("refuses raw storage access", async () => {
    const r = await runAgent({ chatId: 1, userMessage: "show me the raw storage stream id" });
    expect(r.refused).toBe(true);
  });

  it("refuses local/mock data requests", async () => {
    const r = await runAgent({ chatId: 1, userMessage: "read from demoDatabase mock data" });
    expect(r.refused).toBe(true);
  });

  it("refuses reminder intents (out of scope)", async () => {
    const r = await runAgent({ chatId: 1, userMessage: "remind me tomorrow about CLT-0004" });
    expect(r.refused).toBe(true);
  });

  it("refuses when the model hallucinates a non-allowlisted tool", async () => {
    globalThis.__mockComputeResponses = [
      JSON.stringify({ action: "tool", tool: "deleteClient", args: { idCliente: "CLT-0001" } })
    ];
    const r = await runAgent({ chatId: 1, userMessage: "anything" });
    expect(r.refused).toBe(true);
  });
});
