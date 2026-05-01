import { describe, it, expect, beforeEach, vi } from "vitest";
import { __memStore } from "@/test/setupEnv";

// Replace the Telegram client so tests don't POST to api.telegram.org.
vi.mock("@/lib/telegram/client", () => ({
  sendMessage: vi.fn(async () => undefined),
  setWebhook: vi.fn(async () => undefined),
  deleteWebhook: vi.fn(async () => undefined)
}));

import { POST } from "@/app/api/telegram/route";
import { K } from "@/lib/storage/keys";
import { readEncryptedJSON } from "@/lib/storage/zeroGStorage";
import type { ChatBinding } from "@/lib/types/domain";

function makeReq(body: unknown): Request {
  return new Request("https://test/api/telegram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-webhook-secret-1234"
    },
    body: JSON.stringify(body)
  });
}

function startUpdate(chatId: number) {
  return {
    update_id: chatId,
    message: {
      message_id: 1,
      date: 1,
      chat: { id: chatId },
      from: { id: chatId, is_bot: false },
      text: "/start test-invite-code"
    }
  };
}

describe("POST /api/telegram — multi-chat sharing the demo tenant", () => {
  beforeEach(() => {
    __memStore.clear();
  });

  it("multiple chat ids bind to the SAME `demo` tenant", async () => {
    const res1 = await POST(makeReq(startUpdate(111)));
    const res2 = await POST(makeReq(startUpdate(222)));
    const res3 = await POST(makeReq(startUpdate(333)));
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    const b1 = await readEncryptedJSON<ChatBinding>(K.chatBinding(111));
    const b2 = await readEncryptedJSON<ChatBinding>(K.chatBinding(222));
    const b3 = await readEncryptedJSON<ChatBinding>(K.chatBinding(333));
    expect(b1?.tenantId).toBe("demo");
    expect(b2?.tenantId).toBe("demo");
    expect(b3?.tenantId).toBe("demo");
  });

  it("rejects requests with bad secret header (401)", async () => {
    const req = new Request("https://test/api/telegram", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": "nope"
      },
      body: JSON.stringify(startUpdate(999))
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
