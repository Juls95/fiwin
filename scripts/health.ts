/**
 * CLI health check runner: `pnpm health`.
 *
 * Invokes the same checks as GET /api/health/0g, but from the command line
 * so operators can verify 0G connectivity before starting the Next.js server.
 */
import { getEnv } from "../src/lib/config/env";
import { K } from "../src/lib/storage/keys";
import { storageHealthCheck } from "../src/lib/storage/zeroGStorage";
import { computeHealthCheck } from "../src/lib/agent/model0g";

async function main() {
  console.log("→ env");
  getEnv();
  console.log("  ok");

  console.log("→ 0G storage");
  const s0 = Date.now();
  await storageHealthCheck(K.health());
  console.log(`  ok (${Date.now() - s0} ms)`);

  console.log("→ 0G compute");
  const c0 = Date.now();
  await computeHealthCheck();
  console.log(`  ok (${Date.now() - c0} ms)`);

  console.log("\nall checks passed.");
}

main().catch((err) => {
  console.error("health check failed:", (err as Error).message);
  process.exit(1);
});
