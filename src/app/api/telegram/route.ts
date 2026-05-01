import { NextResponse } from "next/server";
import { validateWebhook, extractMessage } from "@/lib/telegram/validate";
import {
  loadChatContext,
  handleStartOrReject,
  Replies
} from "@/lib/telegram/binding";
import { sendMessage } from "@/lib/telegram/client";
import { K } from "@/lib/storage/keys";
import { appendChatEvent } from "@/lib/storage/zeroGStorage";
import type { ChatEvent } from "@/lib/types/domain";
import { runAgent } from "@/lib/agent/orchestrator";
import { updateDailySummary } from "@/lib/tools/memoryTools";

// 0G SDK + node crypto require the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_HEADER = "x-telegram-bot-api-secret-token";

export async function POST(req: Request): Promise<Response> {
  // 1. Validate webhook secret + parse update before anything else.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const secret = req.headers.get(SECRET_HEADER);
  const check = validateWebhook(secret, body);
  if (!check.ok) {
    return NextResponse.json(
      { ok: false },
      { status: check.reason === "bad_secret" ? 401 : 400 }
    );
  }

  const msg = extractMessage(check.update);
  // Telegram expects 200 for updates we ignore on purpose (non-message types,
  // empty text, etc.) — otherwise it retries aggressively.
  if (!msg || msg.text.length === 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { chatId, text } = msg;
  const ctx = await loadChatContext(chatId);

  // 2. Unbound or /start path: delegate to the binding state machine.
  const isStart = text.startsWith("/start");
  if (!ctx.binding || isStart) {
    const outcome = await handleStartOrReject(chatId, text, ctx.binding);
    switch (outcome.kind) {
      case "bound":
        await sendMessage(chatId, Replies.welcome);
        break;
      case "already_bound":
        await sendMessage(chatId, Replies.alreadyBound);
        break;
      case "needs_start":
        await sendMessage(chatId, Replies.needsStart);
        break;
      case "invalid_code":
        await sendMessage(chatId, Replies.invalidCode);
        break;
    }
    return NextResponse.json({ ok: true });
  }

  // 3. Bound chat, non-/start message: append to chat log, route to agent.
  const now = new Date().toISOString();
  const userEvent: ChatEvent = { chatId, role: "user", content: text, at: now };
  await appendChatEvent(K.chatMessages(chatId), userEvent);

  // Run the agent orchestrator (0G Compute + allowlisted tools only).
  let replyText: string;
  try {
    const result = await runAgent({ chatId, userMessage: text });
    replyText = result.reply;
  } catch (err) {
    replyText = `Sorry, something went wrong: ${(err as Error).message.slice(0, 180)}`;
  }

  const replyEvent: ChatEvent = {
    chatId,
    role: "assistant",
    content: replyText,
    at: new Date().toISOString()
  };
  await appendChatEvent(K.chatMessages(chatId), replyEvent);
  await sendMessage(chatId, replyText);

  // Best-effort daily summary refresh (failures do not block the reply).
  void updateDailySummary(chatId);

  return NextResponse.json({ ok: true });
}
