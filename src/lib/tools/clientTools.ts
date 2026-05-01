/**
 * Phase 8 placeholder. Real implementations arrive in Phase 8.
 * Stubs throw so that any accidental orchestrator execution fails loudly
 * instead of silently returning empty data.
 */
import type {
  ClientCreateInputSchema,
  ClientUpdatePatchSchema
} from "@/lib/validation/schemas";
import type { z } from "zod";
import type { ClientRecord } from "@/lib/types/domain";

type NotImpl = (..._args: unknown[]) => Promise<never>;
const notImpl = (name: string): NotImpl => async () => {
  throw new Error(`[tools] ${name} not implemented yet (Phase 8).`);
};

export const listClients = notImpl("listClients") as (opts?: {
  limit?: number;
}) => Promise<ClientRecord[]>;

export const getClient = notImpl("getClient") as (args: {
  idCliente: string;
}) => Promise<ClientRecord | null>;

export const createClient = notImpl("createClient") as (
  input: z.infer<typeof ClientCreateInputSchema>
) => Promise<ClientRecord>;

export const updateClient = notImpl("updateClient") as (args: {
  idCliente: string;
  patch: z.infer<typeof ClientUpdatePatchSchema>;
}) => Promise<ClientRecord>;

export const summarizeClient = notImpl("summarizeClient") as (args: {
  idCliente: string;
}) => Promise<{ idCliente: string; summary: string }>;
