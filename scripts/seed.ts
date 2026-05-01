/**
 * CLI seed runner: `pnpm seed`.
 *
 * Idempotently bootstraps tenant:demo + the five demo client rows into 0G.
 * Safe to re-run — skips seeding if clients:index already exists.
 */
import { bootstrapDemoTenant } from "../src/lib/storage/bootstrap";

async function main() {
  const result = await bootstrapDemoTenant();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((err) => {
  console.error("seed failed:", (err as Error).message);
  process.exit(1);
});
