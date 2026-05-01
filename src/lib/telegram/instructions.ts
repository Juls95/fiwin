import { getEnv } from "@/lib/config/env";

/**
 * Safe, user-facing instructions returned after a valid invite.
 *
 * Must NEVER include: the bot token, the webhook secret, 0G keys, encryption
 * keys, private keys, or any env value besides the public bot username.
 * The invite code itself is echoed back because the user just typed it — so
 * they can paste it straight into Telegram — nothing secret leaks here.
 */

export interface ConnectInstructions {
  botUsername: string;
  botDeepLink: string;
  steps: string[];
  notes: string[];
}

export function buildConnectInstructions(inviteCode: string): ConnectInstructions {
  const { TELEGRAM_BOT_USERNAME } = getEnv();
  const username = TELEGRAM_BOT_USERNAME.replace(/^@/, "");
  return {
    botUsername: `@${username}`,
    botDeepLink: `https://t.me/${username}?start=${encodeURIComponent(inviteCode)}`,
    steps: [
      `Open the Fiwin demo bot on Telegram: @${username}`,
      `Send: /start ${inviteCode}`,
      "Then ask about clients, e.g. 'list clients' or 'summarize CLT-0001'."
    ],
    notes: [
      "The bot replies in English.",
      "All client data, chat history, and daily summaries are encrypted and stored on 0G testnet.",
      "The agent cannot delete records, retrieve raw storage keys, or answer from local mock data."
    ]
  };
}
