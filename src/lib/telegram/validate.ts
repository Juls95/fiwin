import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/config/env";
import { TelegramUpdateSchema, type TelegramUpdate } from "@/lib/validation/schemas";

/**
 * Webhook validation:
 *   1. Constant-time check of X-Telegram-Bot-Api-Secret-Token header
 *      against TELEGRAM_WEBHOOK_SECRET.
 *   2. Zod-parse the update body into our typed subset.
 *
 * Callers must treat ValidateResult.ok === false as a 401/400 with NO
 * body details — do not echo anything that could help an attacker probe.
 */

export type ValidateResult =
  | { ok: true; update: TelegramUpdate }
  | { ok: false; reason: "bad_secret" | "invalid_body" };

export function checkWebhookSecret(headerValue: string | null | undefined): boolean {
  if (!headerValue) return false;
  const expected = getEnv().TELEGRAM_WEBHOOK_SECRET;
  const a = Buffer.from(headerValue, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    // Keep timing roughly uniform on length mismatch.
    timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

export function parseTelegramUpdate(body: unknown): ValidateResult {
  const parsed = TelegramUpdateSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "invalid_body" };
  return { ok: true, update: parsed.data };
}

export function validateWebhook(
  headerValue: string | null | undefined,
  body: unknown
): ValidateResult {
  if (!checkWebhookSecret(headerValue)) return { ok: false, reason: "bad_secret" };
  return parseTelegramUpdate(body);
}

/**
 * Extract the most-recently-relevant message from an update.
 * Prefers `message`, falls back to `edited_message`. Returns null for
 * updates we don't handle (channel posts, callbacks, etc. are out of scope
 * for the MVP).
 */
export function extractMessage(update: TelegramUpdate) {
  const msg = update.message ?? update.edited_message ?? null;
  if (!msg) return null;
  const text = (msg.text ?? "").trim();
  return {
    chatId: msg.chat.id,
    text,
    userId: msg.from?.id ?? null,
    username: msg.from?.username ?? null
  };
}
