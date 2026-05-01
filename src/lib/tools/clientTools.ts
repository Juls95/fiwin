import type { z } from "zod";
import { K } from "@/lib/storage/keys";
import {
  readEncryptedJSON,
  writeEncryptedJSON
} from "@/lib/storage/zeroGStorage";
import {
  ClientRecordSchema,
  ClientCreateInputSchema,
  ClientUpdatePatchSchema
} from "@/lib/validation/schemas";
import type { ClientRecord } from "@/lib/types/domain";
import { chatCompletion } from "@/lib/agent/model0g";

/**
 * Client tools — the only way the agent reads/writes client data.
 *
 * Rules (Phase 8 plan):
 *   - listClients: read clients:index from 0G, then each clients:{id}.
 *   - getClient: read one clients:{id} from 0G.
 *   - createClient: write clients:{id} + update clients:index.
 *   - updateClient: patch allowed fields only (schema enforces allowlist).
 *   - summarizeClient: read from 0G, then call 0G Compute for the summary.
 *   - NO delete. NO generic query. NO key retrieval.
 *
 * Nothing in this file reads demoDatabase.ts. Runtime answers come from 0G.
 */

async function readClient(idCliente: string): Promise<ClientRecord | null> {
  const raw = await readEncryptedJSON<unknown>(K.client(idCliente));
  if (!raw) return null;
  const parsed = ClientRecordSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `[clientTools] stored client '${idCliente}' failed schema validation`
    );
  }
  return parsed.data;
}

async function readIndex(): Promise<string[]> {
  const idx = await readEncryptedJSON<unknown>(K.clientsIndex());
  if (!idx) return [];
  if (!Array.isArray(idx) || !idx.every((v) => typeof v === "string")) {
    throw new Error("[clientTools] clients:index is corrupt");
  }
  return idx as string[];
}

async function writeIndex(ids: string[]): Promise<void> {
  // Dedupe + preserve insertion order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  await writeEncryptedJSON(K.clientsIndex(), out);
}

/* ----------------------------- listClients ----------------------------- */

export async function listClients(opts?: {
  limit?: number;
}): Promise<ClientRecord[]> {
  const ids = await readIndex();
  const sliced = typeof opts?.limit === "number" ? ids.slice(0, opts.limit) : ids;
  const out: ClientRecord[] = [];
  for (const id of sliced) {
    const rec = await readClient(id);
    if (rec) out.push(rec);
  }
  return out;
}

/* ------------------------------ getClient ------------------------------ */

export async function getClient(args: {
  idCliente: string;
}): Promise<ClientRecord | null> {
  return readClient(args.idCliente);
}

/* ----------------------------- createClient ---------------------------- */

export async function createClient(
  input: z.infer<typeof ClientCreateInputSchema>
): Promise<ClientRecord> {
  // Validate input (defense in depth — orchestrator already parsed it).
  const parsed = ClientCreateInputSchema.parse(input);

  const ids = await readIndex();
  if (ids.includes(parsed.idCliente)) {
    throw new Error(`client '${parsed.idCliente}' already exists`);
  }
  const now = new Date().toISOString();
  const record: ClientRecord = {
    ...parsed,
    createdAt: now,
    updatedAt: now
  };
  // Write the record FIRST so readers never see an index entry with no body.
  await writeEncryptedJSON(K.client(record.idCliente), record);
  await writeIndex([...ids, record.idCliente]);
  return record;
}

/* ----------------------------- updateClient ---------------------------- */

export async function updateClient(args: {
  idCliente: string;
  patch: z.infer<typeof ClientUpdatePatchSchema>;
}): Promise<ClientRecord> {
  const existing = await readClient(args.idCliente);
  if (!existing) throw new Error(`client '${args.idCliente}' not found`);

  const patch = ClientUpdatePatchSchema.parse(args.patch);
  const merged: ClientRecord = {
    ...existing,
    ...patch,
    // Preserve identity + metadata integrity — never patched by agent.
    idCliente: existing.idCliente,
    numeroId: existing.numeroId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };
  const validated = ClientRecordSchema.parse(merged);
  await writeEncryptedJSON(K.client(validated.idCliente), validated);
  return validated;
}

/* --------------------------- summarizeClient --------------------------- */

export async function summarizeClient(args: {
  idCliente: string;
}): Promise<{ idCliente: string; summary: string }> {
  const client = await readClient(args.idCliente);
  if (!client) throw new Error(`client '${args.idCliente}' not found`);

  // Pass only the domain record — not 0G keys or envelopes.
  const prompt =
    "Summarize the following client for a company operations dashboard. " +
    "Be concise (3-5 sentences), in English, and highlight status, periodicidad, " +
    "pending dates (fechaDeEmision, fechaDeInicio), and any red flags from observaciones.";
  const res = await chatCompletion({
    temperature: 0.2,
    maxTokens: 300,
    messages: [
      { role: "system", content: "You are a business operations summarizer. Reply in English only." },
      {
        role: "user",
        content: `${prompt}\n\nClient JSON:\n${JSON.stringify(client, null, 2)}`
      }
    ]
  });
  return { idCliente: client.idCliente, summary: res.content.trim() };
}
