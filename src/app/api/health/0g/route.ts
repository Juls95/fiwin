import { NextResponse } from "next/server";
import { getEnv } from "@/lib/config/env";
import { K } from "@/lib/storage/keys";
import { storageHealthCheck } from "@/lib/storage/zeroGStorage";
import { computeHealthCheck } from "@/lib/agent/model0g";

// 0G SDK + node crypto require the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  ms?: number;
  error?: string;
}

async function timed(fn: () => Promise<void>): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: (err as Error).message.slice(0, 240)
    };
  }
}

/**
 * GET /api/health/0g
 *
 * Reports three checks:
 *   1. env: all required env vars parse.
 *   2. storage: encrypted read/write round-trip against the health probe key.
 *   3. compute: tiny 0G Compute round-trip.
 *
 * Returns 200 only if all three pass. Never echoes secrets — just booleans,
 * latencies, and short error messages.
 */
export async function GET(): Promise<Response> {
  // 1. Env validation.
  let env: CheckResult;
  try {
    getEnv();
    env = { ok: true };
  } catch (err) {
    env = { ok: false, error: (err as Error).message.slice(0, 240) };
  }

  // If env fails, skip the other checks — they would throw the same error.
  if (!env.ok) {
    return NextResponse.json(
      { ok: false, checks: { env, storage: { ok: false, error: "skipped" }, compute: { ok: false, error: "skipped" } } },
      { status: 503 }
    );
  }

  const [storage, compute] = await Promise.all([
    timed(() => storageHealthCheck(K.health())),
    timed(() => computeHealthCheck())
  ]);

  const ok = env.ok && storage.ok && compute.ok;
  return NextResponse.json(
    { ok, checks: { env, storage, compute } },
    { status: ok ? 200 : 503 }
  );
}
