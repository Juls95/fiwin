# Fiwin MVP — Demo Operator Checklist

Two-day MVP. Run these steps **in order**. All commands assume `pnpm` and the repo working directory.

> ⚠️ Run `pnpm install` in an isolated Dev Container / Docker / separate folder first.
> The `.npmrc` enforces `save-exact=true`, `ignore-scripts=true`, `min-release-age=7`.

---

## 1. Configure environment

Copy `.env.example` → `.env` and fill in every value:

| Variable | Source |
| --- | --- |
| `INVITE_CODE` | Any non-trivial string ≥ 4 chars. Share only with demo attendees. |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) — `/newbot`. |
| `TELEGRAM_BOT_USERNAME` | The `@handle` BotFather returned (without `@`). |
| `TELEGRAM_WEBHOOK_SECRET` | 32+ random chars. Used as the `X-Telegram-Bot-Api-Secret-Token` header. |
| `PUBLIC_APP_URL` | The public HTTPS URL where Next.js is reachable (e.g. Vercel, ngrok). |
| `ZEROG_COMPUTE_RPC_URL` | 0G testnet EVM RPC (e.g. `https://evmrpc-testnet.0g.ai`). |
| `ZEROG_COMPUTE_PROVIDER_ADDRESS` | EVM address of the 0G Compute provider you want to route to. |
| `ZEROG_COMPUTE_MODEL` | Model id exposed by that provider (e.g. `llama-3.3-70b-instruct`). |
| `ZEROG_COMPUTE_API_KEY` | Optional; leave empty unless your provider requires it. |
| `ZEROG_STORAGE_RPC_URL` | Same 0G testnet EVM RPC. |
| `ZEROG_STORAGE_INDEXER_URL` | 0G Storage indexer (e.g. `https://indexer-storage-testnet-turbo.0g.ai`). |
| `ZEROG_API_KEY` | Optional 0G Storage indexer API key. |
| `ZEROG_PRIVATE_KEY` | Funded testnet signer. Pays gas for storage writes and compute settlement. |
| `DEMO_ENCRYPTION_KEY` | 64 hex chars (32 bytes). Generate: `openssl rand -hex 32`. |

---

## 2. Install dependencies (isolated)

```bash
pnpm install --ignore-scripts
```

---

## 3. Start the app

```bash
pnpm dev      # dev
# or
pnpm build && pnpm start
```

---

## 4. Run the 0G health check

```bash
pnpm health
```

Or, with the server running:

```bash
curl -s $PUBLIC_APP_URL/api/health/0g | jq
```

Expected:

```json
{ "ok": true, "checks": { "env": { "ok": true }, "storage": { "ok": true }, "compute": { "ok": true } } }
```

If any check fails, **do not seed**. Fix connectivity first.

You can also run the complete Step 14 operator sequence:

```bash
pnpm demo:ops
```

This validates env, runs 0G Storage and Compute health checks, seeds the demo
database, and sets the Telegram webhook. It stops on the first failure and never
prints secrets.

---

## 5. Seed the demo database

```bash
pnpm seed
```

Idempotent — re-runs are no-ops once `clients:index` exists on 0G.

---

## 6. Set the Telegram webhook

One-time per environment:

```bash
pnpm tsx scripts/setWebhook.ts
```

This sets the webhook URL to `{PUBLIC_APP_URL}/api/telegram` with the secret header.

If Corepack blocks `pnpm` locally, use the already-installed project binary:

```bash
./node_modules/.bin/tsx scripts/demo.ts
```

---

## 7. Open `/connect`

Visit `{PUBLIC_APP_URL}/connect`.

## 8. Enter invite code

Paste `INVITE_CODE`. The page returns safe instructions + a deep link to the bot.

## 9. Open the Telegram bot

Tap the deep link or open `@{TELEGRAM_BOT_USERNAME}` manually.

## 10. Send `/start <inviteCode>`

The bot replies in English with a welcome and example commands.

---

## 11. Demo flow

Run these messages in the bot, in order:

1. `list clients` → five seeded clients.
2. `get CLT-0001` → full record.
3. `update CLT-0004 observaciones "Payment received; moving to active."` (or simply describe the change — the agent maps to `updateClient`).
4. `create a new prospect named "Demo Corp" with idCliente CLT-1001 origen referral periodicidad monthly formaDePago bank_transfer pagoTotal 1000 fechaDeContacto 2026-05-01` → new client row on 0G.
5. `summarize CLT-0003` → 0G Compute-generated English summary.
6. `what did we discuss today?` → recalls via `recallConversation` (prefers daily summary, falls back to raw events).

---

## Rollback

See the Rollback section in `requirements/mvp-implementation-plan.md`:

1. Remove the Telegram webhook: `pnpm tsx -e "import('./src/lib/telegram/client').then(m => m.deleteWebhook())"` — or just call Telegram's `deleteWebhook` endpoint directly.
2. Rotate `DEMO_ENCRYPTION_KEY` if it was exposed. Note: previously stored 0G records become unreadable; treat them as abandoned.
3. Abandon the 0G testnet stream namespace; redeploy with a new `STREAM_NAMESPACE` (in `src/lib/storage/keys.ts`) to start clean.
