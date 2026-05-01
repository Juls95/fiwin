import { K } from "@/lib/storage/keys";
import {
  readChatEvents,
  readEncryptedJSON,
  writeEncryptedJSON
} from "@/lib/storage/zeroGStorage";
import { DailyMemorySummarySchema } from "@/lib/validation/schemas";
import type { ChatEvent, DailyMemorySummary } from "@/lib/types/domain";
import { chatCompletion } from "@/lib/agent/model0g";

/**
 * Memory tools — the only way the agent accesses chat history.
 *
 * Rules (Phase 9 plan):
 *   - Raw chat events live encrypted under chats:{chatId}:messages.
 *   - Daily summaries live encrypted under memory:daily:{date}.
 *   - recallConversation prefers the summary; falls back to raw events +
 *     on-the-fly 0G Compute summary if no summary exists.
 *   - Never reads from demoDatabase or any local source.
 *   - Summary generation is best-effort: failures never block the webhook
 *     from persisting raw chat events.
 */

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function eventsForDate(events: ChatEvent[], date: string): ChatEvent[] {
  return events.filter((e) => e.at.slice(0, 10) === date);
}

/* --------------------------- summary generation -------------------------- */

/**
 * Regenerate the daily summary after a new accepted message.
 * Best-effort: on failure, we keep the raw events and continue responding.
 */
export async function updateDailySummary(chatId: number): Promise<void> {
  try {
    const date = todayUtc();
    const events = await readChatEvents(K.chatMessages(chatId));
    const todays = eventsForDate(events, date).filter(
      (e) => e.role === "user" || e.role === "assistant"
    );
    if (todays.length === 0) return;

    const transcript = todays
      .map((e) => `${e.role.toUpperCase()} [${e.at}]: ${e.content}`)
      .join("\n");

    const res = await chatCompletion({
      temperature: 0.2,
      maxTokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You maintain a concise English daily summary of a chat. Output a short paragraph (≤ 120 words) covering the main topics discussed, decisions made, and open items. Do not quote verbatim."
        },
        {
          role: "user",
          content: `Chat ${chatId} — date ${date} — ${todays.length} messages.\n\n${transcript}`
        }
      ]
    });

    const summary: DailyMemorySummary = {
      date,
      summary: res.content.trim(),
      messageCount: todays.length,
      updatedAt: new Date().toISOString()
    };
    DailyMemorySummarySchema.parse(summary);
    await writeEncryptedJSON(K.memoryDaily(date), summary);
  } catch {
    // Swallow: raw events remain, next message will retry.
  }
}

/* --------------------------- recallConversation -------------------------- */

export interface RecallResult {
  date: string;
  summary: string;
  source: "daily" | "raw" | "none";
}

export async function recallConversation(args: {
  chatId: number;
  date?: string;
}): Promise<RecallResult> {
  const date = args.date ?? todayUtc();

  // 1. Prefer the stored daily summary.
  const stored = await readEncryptedJSON<DailyMemorySummary>(K.memoryDaily(date));
  if (stored) {
    const parsed = DailyMemorySummarySchema.safeParse(stored);
    if (parsed.success && parsed.data.summary.length > 0) {
      return { date, summary: parsed.data.summary, source: "daily" };
    }
  }

  // 2. Fall back to raw events for this chat on that date, summarize on demand.
  const events = await readChatEvents(K.chatMessages(args.chatId));
  const todays = eventsForDate(events, date).filter(
    (e) => e.role === "user" || e.role === "assistant"
  );
  if (todays.length === 0) {
    return {
      date,
      summary: `No conversation recorded for chat ${args.chatId} on ${date}.`,
      source: "none"
    };
  }

  const transcript = todays
    .map((e) => `${e.role.toUpperCase()} [${e.at}]: ${e.content}`)
    .join("\n");
  const res = await chatCompletion({
    temperature: 0.2,
    maxTokens: 400,
    messages: [
      {
        role: "system",
        content:
          "Summarize the following chat transcript in English (≤ 120 words). Focus on topics, decisions, and open items."
      },
      { role: "user", content: transcript }
    ]
  });
  return { date, summary: res.content.trim(), source: "raw" };
}
