import { describe, it, expect } from "vitest";
import { checkWebhookSecret, parseTelegramUpdate, validateWebhook } from "@/lib/telegram/validate";

describe("telegram validate", () => {
  it("accepts the exact env webhook secret", () => {
    expect(checkWebhookSecret("test-webhook-secret-1234")).toBe(true);
  });

  it("rejects wrong/missing secrets", () => {
    expect(checkWebhookSecret("wrong")).toBe(false);
    expect(checkWebhookSecret(null)).toBe(false);
    expect(checkWebhookSecret(undefined)).toBe(false);
    expect(checkWebhookSecret("")).toBe(false);
  });

  it("rejects malformed updates", () => {
    expect(parseTelegramUpdate({}).ok).toBe(false);
    expect(parseTelegramUpdate({ update_id: "str" }).ok).toBe(false);
    expect(parseTelegramUpdate(null).ok).toBe(false);
  });

  it("accepts a minimal message update", () => {
    const upd = {
      update_id: 1,
      message: {
        message_id: 10,
        date: 1700000000,
        chat: { id: 42, type: "private" },
        text: "hi"
      }
    };
    expect(parseTelegramUpdate(upd).ok).toBe(true);
  });

  it("validateWebhook combines both checks", () => {
    const good = validateWebhook("test-webhook-secret-1234", {
      update_id: 2,
      message: { message_id: 1, date: 1, chat: { id: 1 }, text: "x" }
    });
    expect(good.ok).toBe(true);
    const badSecret = validateWebhook("nope", {});
    expect(badSecret.ok).toBe(false);
  });
});
