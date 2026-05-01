import { K } from "@/lib/storage/keys";
import {
  keyExists,
  readEncryptedJSON,
  writeEncryptedJSON
} from "@/lib/storage/zeroGStorage";
import { ClientRecordSchema } from "@/lib/validation/schemas";
import type { ClientRecord } from "@/lib/types/domain";

/**
 * Seed the five demo client rows into 0G — ONLY if clients:index is missing.
 *
 * This is the single module allowed to import demoDatabase.ts. Runtime
 * agent/tool code must never pull from seed data (enforced by convention +
 * tests in Phase 12).
 */
export async function seedDemoDatabase(): Promise<void> {
  if (await keyExists(K.clientsIndex())) {
    // Already seeded — no-op. Honor the "seed only if missing" rule.
    return;
  }

  // Lazy import so the seed array never appears in non-seed import graphs.
  const { DEMO_CLIENTS } = await import("@/lib/mock/demoDatabase");

  if (DEMO_CLIENTS.length !== 5) {
    throw new Error(
      `[seed] expected exactly 5 seed clients, got ${DEMO_CLIENTS.length}`
    );
  }

  const ids: string[] = [];
  for (const raw of DEMO_CLIENTS) {
    // Validate each row against the domain schema before writing.
    const client: ClientRecord = ClientRecordSchema.parse(raw);
    await writeEncryptedJSON(K.client(client.idCliente), client);
    ids.push(client.idCliente);
  }

  // Write the index last so readers never observe a partial state.
  const existingIndex = (await readEncryptedJSON<string[]>(K.clientsIndex())) ?? [];
  const merged = Array.from(new Set([...existingIndex, ...ids]));
  await writeEncryptedJSON(K.clientsIndex(), merged);
}
