import { describe, it, expect, beforeEach } from "vitest";
import { __memStore } from "@/test/setupEnv";
import { K } from "@/lib/storage/keys";
import { appendChatEvent } from "@/lib/storage/zeroGStorage";
import { recallConversation, updateDailySummary } from "@/lib/tools/memoryTools";
import type { ChatEvent } from "@/lib/types/domain";

const today = new Date().toISOString().slice(0, 10);

describe("memoryTools", () => {
  beforeEach(() => {
    __memStore.clear();
    globalThis.__mockComputeResponses = [];
  });

  it("stores chat events and daily summaries encrypted on 0G", async () => {
    const chatId = 500;
    const event: ChatEvent = {
      chatId,
      role: "user",
      content: "hello",
      at: new Date().toISOString()
    };
    await appendChatEvent(K.chatMessages(chatId), event);

    // Raw storage is encrypted (envelope JSON), not plaintext.
    const raw = __memStore.get(K.chatMessages(chatId))!;
    expect(raw).toMatch(/"v":1/);
    expect(raw).toMatch(/"ct":/);
    expect(raw).not.toContain("hello");

    globalThis.__mockComputeResponses = ["Today we said hello."];
    await updateDailySummary(chatId);
    const summaryRaw = __memStore.get(K.memoryDaily(today))!;
    expect(summaryRaw).toMatch(/"ct":/);
    expect(summaryRaw).not.toContain("Today we said hello");
  });

  it("recallConversation returns 'none' when no history for the date", async () => {
    const r = await recallConversation({ chatId: 999, date: today });
    expect(r.source).toBe("none");
  });

  it("recallConversation prefers the stored daily summary", async () => {
    const chatId = 600;
    await appendChatEvent(K.chatMessages(chatId), {
      chatId,
      role: "user",
      content: "discuss pricing",
      at: new Date().toISOString()
    });
    globalThis.__mockComputeResponses = ["Pricing discussed."];
    await updateDailySummary(chatId);

    const r = await recallConversation({ chatId, date: today });
    expect(r.source).toBe("daily");
    expect(r.summary).toContain("Pricing");
  });
});
