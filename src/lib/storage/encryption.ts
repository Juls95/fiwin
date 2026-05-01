import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnv } from "@/lib/config/env";
import type { EncryptedEnvelope } from "@/lib/types/domain";

/**
 * AES-256-GCM authenticated encryption with per-record random IV.
 * Ciphertext + IV + tag are packed into a JSON envelope before being
 * written to 0G. Nothing plaintext ever leaves this module.
 */

const ALG = "aes-256-gcm";
const IV_LEN = 12; // 96-bit IV for GCM

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const { DEMO_ENCRYPTION_KEY } = getEnv();
  const buf = Buffer.from(DEMO_ENCRYPTION_KEY, "hex");
  if (buf.length !== 32) {
    throw new Error("[encryption] DEMO_ENCRYPTION_KEY must decode to 32 bytes");
  }
  cachedKey = buf;
  return buf;
}

export function encryptJSON(value: unknown): EncryptedEnvelope {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: "AES-256-GCM",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64")
  };
}

export function decryptJSON<T = unknown>(env: EncryptedEnvelope): T {
  if (env.v !== 1 || env.alg !== "AES-256-GCM") {
    throw new Error(`[encryption] unsupported envelope version=${env.v} alg=${env.alg}`);
  }
  const key = getKey();
  const iv = Buffer.from(env.iv, "base64");
  const tag = Buffer.from(env.tag, "base64");
  const ct = Buffer.from(env.ct, "base64");
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}

/** Test-only reset. */
export function __resetEncryptionCache(): void {
  cachedKey = null;
}
