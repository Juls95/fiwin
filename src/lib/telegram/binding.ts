import { K } from "@/lib/storage/keys";
import {
  appendChatEvent,
  readEncryptedJSON,
  writeEncryptedJSON
} from "@/lib/storage/zeroGStorage";
import { hashInviteCode, verifyInviteCode } from "@/lib/invite/codes";
import type { ChatBinding, ChatEvent } from "@/lib/types/domain";
import { TENANT_ID } from "@/lib/types/domain";

/**
 * Chat ↔ demo tenant binding state machine.
 *
 * Rules (from plan §Phase 6):
 *   - Unbound chats accept ONLY `/start <inviteCode>`. All other messages
 *     are rejected with a short English nudge.
 *   - A valid invite writes chatBindings:{chatId} and appends a binding
 *     event to chats:{chatId}:messages. Welcome reply in English.
 *   - Many chatIds may bind to the same `demo` tenant — we never
 *     overwrite an existing binding (re-running /start is idempotent).
 *   - No chat can access raw storage or bypass binding.
 */

const START_CMD = /^\/start(?:@\w+)?(?:\s+(\S+))?\s*$/i;

export interface ChatContext {
  chatId: number;
  binding: ChatBinding | null;
}

export async function loadChatContext(chatId: number): Promise<ChatContext> {
  const binding = await readEncryptedJSON<ChatBinding>(K.chatBinding(chatId));
  return { chatId, binding };
}

export type BindOutcome =
  | { kind: "already_bound"; binding: ChatBinding }
  | { kind: "bound"; binding: ChatBinding }
  | { kind: "needs_start" } // unbound, message wasn't /start <code>
  | { kind: "invalid_code" }; // /start provided but code invalid

export async function handleStartOrReject(
  chatId: number,
  text: string,
  existing: ChatBinding | null
): Promise<BindOutcome> {
  if (existing) return { kind: "already_bound", binding: existing };

  const match = START_CMD.exec(text);
  if (!match) return { kind: "needs_start" };
  const code = match[1];
  if (!code || !verifyInviteCode(code)) return { kind: "invalid_code" };

  const binding: ChatBinding = {
    chatId,
    tenantId: TENANT_ID,
    boundAt: new Date().toISOString(),
    inviteCodeHash: hashInviteCode(code)
  };
  await writeEncryptedJSON(K.chatBinding(chatId), binding);

  const bindEvent: ChatEvent = {
    chatId,
    role: "system",
    content: "chat_bound_to_demo_tenant",
    at: binding.boundAt
  };
  await appendChatEvent(K.chatMessages(chatId), bindEvent);

  return { kind: "bound", binding };
}

/** Standard English replies for unbound / invalid states. */
export const Replies = {
  welcome:
    "Welcome to Fiwin. This chat is now connected to the demo workspace. " +
    "Try: 'list clients', 'get CLT-0001', 'summarize CLT-0003', or 'what did we discuss today?'.",
  alreadyBound:
    "You're already connected to the demo workspace. Ask me about clients, e.g. 'list clients'.",
  needsStart:
    "Please connect first by sending: /start <inviteCode>",
  invalidCode:
    "That invite code is not valid. Ask the project team for a working one, then send: /start <inviteCode>"
} as const;
