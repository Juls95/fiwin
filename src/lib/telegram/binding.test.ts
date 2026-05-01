import { describe, it, expect, beforeEach } from "vitest";
import { handleStartOrReject, loadChatContext } from "@/lib/telegram/binding";
import { __memStore } from "@/test/setupEnv";

describe("chat binding", () => {
  beforeEach(() => {
    __memStore.clear();
  });

  it("binds with valid /start <inviteCode>", async () => {
    const chatId = 1001;
    const out = await handleStartOrReject(chatId, "/start test-invite-code", null);
    expect(out.kind).toBe("bound");
    const ctx = await loadChatContext(chatId);
    expect(ctx.binding?.tenantId).toBe("demo");
    expect(ctx.binding?.inviteCodeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects invalid invite", async () => {
    const out = await handleStartOrReject(2002, "/start wrong-code", null);
    expect(out.kind).toBe("invalid_code");
  });

  it("unbound chat sending anything else → needs_start", async () => {
    const out = await handleStartOrReject(3003, "list clients", null);
    expect(out.kind).toBe("needs_start");
  });

  it("/start on already-bound chat is idempotent (already_bound)", async () => {
    const chatId = 4004;
    await handleStartOrReject(chatId, "/start test-invite-code", null);
    const ctx = await loadChatContext(chatId);
    const again = await handleStartOrReject(
      chatId,
      "/start test-invite-code",
      ctx.binding
    );
    expect(again.kind).toBe("already_bound");
  });
});
