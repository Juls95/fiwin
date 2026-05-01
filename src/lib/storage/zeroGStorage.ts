import { Wallet, JsonRpcProvider, getBytes } from "ethers";
import {
  Batcher,
  Indexer,
  KvClient,
  FixedPriceFlow__factory
} from "@0glabs/0g-ts-sdk";
import { getEnv } from "@/lib/config/env";
import { getStreamId, keyToBytes } from "@/lib/storage/keys";
import { encryptJSON, decryptJSON } from "@/lib/storage/encryption";
import type { ChatEvent, EncryptedEnvelope } from "@/lib/types/domain";

/**
 * Thin adapter over 0G Storage KV.
 *
 * All writes go through a Batcher scoped to a deterministic streamId.
 * All reads go through KvClient against the KV RPC endpoint.
 * Every payload is encrypted via encryption.ts before upload.
 *
 * The agent / tools MUST import only the public helpers in this file.
 * Never expose raw KvClient, Batcher, or streamId outside this module.
 */

/** Flow contract address for 0G testnet. Matches the indexer network. */
const FLOW_CONTRACT_FALLBACK = "0xbD2C3F0E65eDF5582141C35969d66e34629cC768";

let wallet: Wallet | null = null;
let provider: JsonRpcProvider | null = null;
let indexer: Indexer | null = null;
let kvReader: KvClient | null = null;

function getWallet(): Wallet {
  if (wallet) return wallet;
  const env = getEnv();
  provider = new JsonRpcProvider(env.ZEROG_STORAGE_RPC_URL);
  wallet = new Wallet(env.ZEROG_PRIVATE_KEY, provider);
  return wallet;
}

function getIndexer(): Indexer {
  if (indexer) return indexer;
  indexer = new Indexer(getEnv().ZEROG_STORAGE_INDEXER_URL);
  return indexer;
}

function getKvReader(): KvClient {
  if (kvReader) return kvReader;
  // KV reads go against the indexer endpoint on 0G testnet (KV node proxy).
  kvReader = new KvClient(getEnv().ZEROG_STORAGE_INDEXER_URL);
  return kvReader;
}

async function buildBatcher(): Promise<Batcher> {
  const env = getEnv();
  const [nodes, err] = await getIndexer().selectNodes(1);
  if (err || !nodes || nodes.length === 0) {
    throw new Error(`[0g] indexer.selectNodes failed: ${err?.message ?? "no nodes"}`);
  }
  // Cast: ethers ESM/CJS dual-package causes a Provider nominal-type mismatch
  // against the factory's CJS-typed signature, even though runtime is identical.
  const flow = FixedPriceFlow__factory.connect(
    FLOW_CONTRACT_FALLBACK,
    getWallet() as unknown as Parameters<typeof FixedPriceFlow__factory.connect>[1]
  );
  return new Batcher(1, nodes, flow, env.ZEROG_STORAGE_RPC_URL);
}

/* ------------------------------ primitives ------------------------------ */

export async function writeEncryptedJSON(key: string, value: unknown): Promise<void> {
  const envelope = encryptJSON(value);
  const bytes = Buffer.from(JSON.stringify(envelope), "utf8");
  const streamId = getStreamId();
  const batcher = await buildBatcher();
  batcher.streamDataBuilder.set(streamId, keyToBytes(key), bytes);
  const [, err] = await batcher.exec();
  if (err) throw new Error(`[0g] write '${key}' failed: ${err.message}`);
}

export async function readEncryptedJSON<T = unknown>(key: string): Promise<T | null> {
  const streamId = getStreamId();
  const kv = getKvReader();
  const keyBytes = keyToBytes(key);
  // getValue returns { data: base64, size, version } or null.
  const value = await kv.getValue(streamId, getBytes(keyBytes) as unknown as never).catch(
    () => null
  );
  if (!value || value.size === 0) return null;
  const raw = Buffer.from(value.data, "base64").toString("utf8");
  let envelope: EncryptedEnvelope;
  try {
    envelope = JSON.parse(raw) as EncryptedEnvelope;
  } catch {
    throw new Error(`[0g] key '${key}' is not a valid envelope`);
  }
  return decryptJSON<T>(envelope);
}

export async function keyExists(key: string): Promise<boolean> {
  const v = await readEncryptedJSON(key).catch(() => null);
  return v !== null;
}

/* ---------------------------- chat event log ---------------------------- */
/**
 * 0G KV is last-write-wins per (streamId, key). To "append" chat events we
 * store a JSON array at `chats:{chatId}:messages` using read-modify-write.
 * This is acceptable for MVP demo volume. If contention becomes an issue,
 * shard by (chatId, date) or bump to per-message keys with an index.
 */

export async function appendChatEvent(key: string, event: ChatEvent): Promise<void> {
  const existing = (await readEncryptedJSON<ChatEvent[]>(key)) ?? [];
  existing.push(event);
  await writeEncryptedJSON(key, existing);
}

export async function readChatEvents(key: string): Promise<ChatEvent[]> {
  return (await readEncryptedJSON<ChatEvent[]>(key)) ?? [];
}

/* ----------------------------- health probe ----------------------------- */

export async function storageHealthCheck(probeKey: string): Promise<void> {
  const payload = { ok: true, at: new Date().toISOString() };
  await writeEncryptedJSON(probeKey, payload);
  const read = await readEncryptedJSON<typeof payload>(probeKey);
  if (!read || read.ok !== true) throw new Error("[0g] health probe mismatch");
}

/* ------------------------------ test hooks ------------------------------ */

export function __resetStorageClients(): void {
  wallet = null;
  provider = null;
  indexer = null;
  kvReader = null;
}
