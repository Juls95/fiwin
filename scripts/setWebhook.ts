/**
 * CLI: `pnpm tsx scripts/setWebhook.ts`
 *
 * Registers the Telegram webhook with TELEGRAM_WEBHOOK_SECRET so the bot
 * starts forwarding updates to {PUBLIC_APP_URL}/api/telegram.
 *
 * Webhook setup is an OPERATOR action — not part of normal product runtime
 * (per plan Phase 6). Run it once per environment.
 */
import { getEnv } from "../src/lib/config/env";
import { setWebhook } from "../src/lib/telegram/client";

async function main() {
  const env = getEnv();
  const url = `${env.PUBLIC_APP_URL.replace(/\/$/, "")}/api/telegram`;
  console.log(`→ setting webhook to ${url}`);
  await setWebhook(url, env.TELEGRAM_WEBHOOK_SECRET);
  console.log("  ok");
}

main().catch((err) => {
  console.error("setWebhook failed:", (err as Error).message);
  process.exit(1);
});
