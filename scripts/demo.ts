/**
 * Step 14 operator runner.
 *
 * Runs the environment-changing demo operations in the intended order:
 * health check -> seed demo data -> set Telegram webhook.
 *
 * The live Telegram conversation is still manual because Telegram requires a
 * real user chat to initiate `/start <inviteCode>`.
 */
import { getEnv } from "../src/lib/config/env";
import { computeHealthCheck } from "../src/lib/agent/model0g";
import { bootstrapDemoTenant } from "../src/lib/storage/bootstrap";
import { K } from "../src/lib/storage/keys";
import { storageHealthCheck } from "../src/lib/storage/zeroGStorage";
import { setWebhook } from "../src/lib/telegram/client";

async function main() {
  console.log("Fiwin Step 14 demo runner");

  console.log("\n1. Validate env");
  const env = getEnv();
  console.log("   ok");

  console.log("\n2. Run 0G storage health check");
  await storageHealthCheck(K.health());
  console.log("   ok");

  console.log("\n3. Run 0G compute health check");
  await computeHealthCheck();
  console.log("   ok");

  console.log("\n4. Seed demo database");
  const seed = await bootstrapDemoTenant();
  console.log(`   ok: tenantSeeded=${seed.tenantSeeded}, clientsSeeded=${seed.clientsSeeded}`);

  console.log("\n5. Set Telegram webhook");
  const webhookUrl = `${env.PUBLIC_APP_URL.replace(/\/$/, "")}/api/telegram`;
  await setWebhook(webhookUrl, env.TELEGRAM_WEBHOOK_SECRET);
  console.log(`   ok: ${webhookUrl}`);

  console.log("\n6. Execute live Telegram demo flow manually");
  console.log(`   Open: ${env.PUBLIC_APP_URL.replace(/\/$/, "")}/connect`);
  console.log("   Enter INVITE_CODE, then send /start <inviteCode> to the bot.");
  console.log(
    "   Run: list clients, get CLT-0001, update a client, create a client, summarize a client, and ask what was discussed today."
  );
}

main().catch((err) => {
  console.error("demo runner failed:", (err as Error).message);
  process.exit(1);
});
