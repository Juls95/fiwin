import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Deterministic 0G storage keys.
 *
 * All runtime data lives under a single 32-byte streamId derived from a
 * constant namespace. Each logical record has a UTF-8 key string below.
 *
 * NEVER expose these keys to the agent or to any tool.
 */

/** Namespace → streamId (32-byte keccak hex, 0x-prefixed). */
export const STREAM_NAMESPACE = "fiwin:demo:v1" as const;

export function getStreamId(): `0x${string}` {
  return keccak256(toUtf8Bytes(STREAM_NAMESPACE)) as `0x${string}`;
}

/* ---------- Key builders (single source of truth for all keys) ---------- */

export const K = {
  tenantDemo: (): string => "tenant:demo",
  clientsIndex: (): string => "clients:index",
  client: (id: string): string => `clients:${id}`,
  chatBinding: (chatId: number): string => `chatBindings:${chatId}`,
  chatMessages: (chatId: number): string => `chats:${chatId}:messages`,
  memoryDaily: (date: string): string => `memory:daily:${date}`,
  /** Harmless health probe key. Never contains user data. */
  health: (): string => "health:probe"
} as const;

export function keyToBytes(key: string): Uint8Array {
  return toUtf8Bytes(key);
}
