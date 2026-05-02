import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Centralized, fail-fast environment validation.
 *
 * Imported ONLY from server-side code. Never from components marked "use client".
 * If any required variable is missing or malformed, the process throws at boot.
 */

let loadedDotEnv = false;

function parseEnvLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadLocalEnvIfPresent(): void {
  if (loadedDotEnv) return;
  loadedDotEnv = true;

  const file = path.join(process.cwd(), ".env");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed || process.env[parsed.key] !== undefined) continue;
    process.env[parsed.key] = parsed.value;
  }
}

const hex64 = /^[0-9a-fA-F]{64}$/;
const hexPrivateKey = /^0x[0-9a-fA-F]{64}$/;

const EnvSchema = z.object({
  // Invite gate
  INVITE_CODE: z.string().min(4, "INVITE_CODE must be at least 4 chars"),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_BOT_USERNAME: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8),

  // Public app URL
  PUBLIC_APP_URL: z.string().url(),

  // 0G Compute
  ZEROG_COMPUTE_RPC_URL: z.string().url(),
  ZEROG_COMPUTE_PROVIDER_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "ZEROG_COMPUTE_PROVIDER_ADDRESS must be an EVM address"),
  ZEROG_COMPUTE_MODEL: z.string().min(1),
  ZEROG_COMPUTE_API_KEY: z.string().optional().default(""),

  // 0G Storage
  ZEROG_STORAGE_RPC_URL: z.string().url(),
  ZEROG_STORAGE_INDEXER_URL: z.string().url(),
  ZEROG_API_KEY: z.string().optional().default(""),

  // Signer
  ZEROG_PRIVATE_KEY: z
    .string()
    .regex(hexPrivateKey, "ZEROG_PRIVATE_KEY must be 0x + 64 hex chars"),

  // Encryption
  DEMO_ENCRYPTION_KEY: z
    .string()
    .regex(hex64, "DEMO_ENCRYPTION_KEY must be exactly 64 hex chars (32 bytes)")
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  loadLocalEnvIfPresent();
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`[env] Invalid or missing environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Reset cache — test-only. */
export function __resetEnvCache(): void {
  cached = null;
}
