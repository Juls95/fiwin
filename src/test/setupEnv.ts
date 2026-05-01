/**
 * Vitest global setup — populates process.env with test-safe values BEFORE
 * any module that calls getEnv() is imported. Also wires global mocks for
 * 0G Storage and 0G Compute so tests never hit the network.
 */
import { vi } from "vitest";

process.env.INVITE_CODE = "test-invite-code";
process.env.TELEGRAM_BOT_TOKEN = "123456:test-bot-token";
process.env.TELEGRAM_BOT_USERNAME = "FiwinTestBot";
process.env.TELEGRAM_WEBHOOK_SECRET = "test-webhook-secret-1234";
process.env.PUBLIC_APP_URL = "https://example.test";
process.env.ZEROG_COMPUTE_RPC_URL = "https://rpc.test";
process.env.ZEROG_COMPUTE_PROVIDER_ADDRESS = "0x" + "1".repeat(40);
process.env.ZEROG_COMPUTE_MODEL = "test-model";
process.env.ZEROG_COMPUTE_API_KEY = "";
process.env.ZEROG_STORAGE_RPC_URL = "https://rpc.test";
process.env.ZEROG_STORAGE_INDEXER_URL = "https://indexer.test";
process.env.ZEROG_API_KEY = "";
process.env.ZEROG_PRIVATE_KEY = "0x" + "a".repeat(64);
process.env.DEMO_ENCRYPTION_KEY = "a".repeat(64);

/* ------------------------------------------------------------------ */
/* In-memory 0G Storage mock                                          */
/* Real encryption is preserved (so encryption tests stay meaningful);  */
/* only the network transport is replaced by a Map.                    */
/* ------------------------------------------------------------------ */

export const __memStore = new Map<string, string>();

vi.mock("@/lib/storage/zeroGStorage", async () => {
  const { encryptJSON, decryptJSON } = await import("@/lib/storage/encryption");
  type Envelope = ReturnType<typeof encryptJSON>;

  async function writeEncryptedJSON(key: string, value: unknown): Promise<void> {
    const env = encryptJSON(value);
    __memStore.set(key, JSON.stringify(env));
  }
  async function readEncryptedJSON<T = unknown>(key: string): Promise<T | null> {
    const raw = __memStore.get(key);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope;
    return decryptJSON<T>(env);
  }
  async function keyExists(key: string): Promise<boolean> {
    return __memStore.has(key);
  }
  async function appendChatEvent(key: string, event: unknown): Promise<void> {
    const existing = (await readEncryptedJSON<unknown[]>(key)) ?? [];
    existing.push(event);
    await writeEncryptedJSON(key, existing);
  }
  async function readChatEvents(key: string): Promise<unknown[]> {
    return (await readEncryptedJSON<unknown[]>(key)) ?? [];
  }
  async function storageHealthCheck(probeKey: string): Promise<void> {
    await writeEncryptedJSON(probeKey, { ok: true });
    const v = await readEncryptedJSON<{ ok: boolean }>(probeKey);
    if (!v?.ok) throw new Error("health mismatch");
  }
  function __resetStorageClients(): void {
    __memStore.clear();
  }
  return {
    writeEncryptedJSON,
    readEncryptedJSON,
    keyExists,
    appendChatEvent,
    readChatEvents,
    storageHealthCheck,
    __resetStorageClients
  };
});

/* ------------------------------------------------------------------ */
/* 0G Compute mock                                                    */
/* Programmable via globalThis.__mockCompute (array of string         */
/* responses, consumed FIFO). Default: JSON reply action.             */
/* ------------------------------------------------------------------ */

declare global {
  // eslint-disable-next-line no-var
  var __mockComputeResponses: string[] | undefined;
}

vi.mock("@/lib/agent/model0g", () => {
  async function chatCompletion(_opts: unknown): Promise<{ content: string }> {
    const queue = globalThis.__mockComputeResponses ?? [];
    const next = queue.shift() ?? JSON.stringify({ action: "reply", reply: "OK" });
    return { content: next };
  }
  async function computeHealthCheck(): Promise<void> {
    /* no-op success */
  }
  function __resetComputeClients(): void {}
  return { chatCompletion, computeHealthCheck, __resetComputeClients };
});
