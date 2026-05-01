import { getEnv } from "@/lib/config/env";

/**
 * Minimal Telegram Bot API client — only the calls we actually make.
 *
 * Keep this tiny: sendMessage and setWebhook. No Telegram SDK dependency
 * (one more package = one more supply-chain risk). The bot token never
 * leaves this module.
 */

const TG_API = "https://api.telegram.org";

async function tgCall<T = unknown>(method: string, body: unknown): Promise<T> {
  const { TELEGRAM_BOT_TOKEN } = getEnv();
  const res = await fetch(`${TG_API}/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Strip the token out of any error surface defensively.
    throw new Error(
      `[telegram] ${method} failed: ${res.status} ${text.slice(0, 200)}`.replace(
        TELEGRAM_BOT_TOKEN,
        "<redacted>"
      )
    );
  }
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) {
    throw new Error(`[telegram] ${method} not ok: ${json.description ?? "unknown"}`);
  }
  return json.result;
}

export async function sendMessage(chatId: number, text: string): Promise<void> {
  // Telegram hard caps at 4096 chars per message.
  const safe = text.length > 4000 ? `${text.slice(0, 3990)}…` : text;
  await tgCall("sendMessage", {
    chat_id: chatId,
    text: safe,
    disable_web_page_preview: true
  });
}

export async function setWebhook(url: string, secretToken: string): Promise<void> {
  await tgCall("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: true
  });
}

export async function deleteWebhook(): Promise<void> {
  await tgCall("deleteWebhook", { drop_pending_updates: true });
}
