import { createHash, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/config/env";
import { InviteCodeSchema } from "@/lib/validation/schemas";

/**
 * Env-static invite gate.
 *
 * Only ONE invite code exists for the MVP — the value of INVITE_CODE.
 * All validation is constant-time to avoid timing oracles, and the raw
 * code is never logged or echoed.
 */

export function verifyInviteCode(input: unknown): boolean {
  const parsed = InviteCodeSchema.safeParse(input);
  if (!parsed.success) return false;
  const expected = getEnv().INVITE_CODE;

  const a = Buffer.from(parsed.data, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    // Still do a dummy compare to keep timing roughly constant.
    timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Deterministic SHA-256 hex of the invite code. Stored in chat bindings so
 * we can audit which invite bound a chat without retaining the plaintext.
 */
export function hashInviteCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}
