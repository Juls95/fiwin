# Fiwin MVP

Digital Twin for company operations — two-day MVP.

- Public landing page.
- Env-static invite access at `/connect`.
- One shared Telegram bot → shared `demo` tenant.
- English-only Digital Twin agent.
- **0G Compute** = only inference path.
- **0G testnet Storage** = only runtime source of truth for client data, chat history, and daily memory summaries.

## Setup

```bash
# Install in an isolated Dev Container / Docker / separate folder first.
pnpm install --ignore-scripts
cp .env.example .env   # fill values
pnpm typecheck
pnpm test
pnpm dev
```

Operator checklist: see `docs/demo-script.md`.
