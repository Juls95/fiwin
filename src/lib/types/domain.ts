/**
 * Domain types for Fiwin MVP.
 * Field names come verbatim from requirements/initial_idea.md (Spanish domain terms),
 * even though the agent answers in English.
 */

export const TENANT_ID = "demo" as const;
export type TenantId = typeof TENANT_ID;

export type ClientStatus =
  | "active"
  | "prospect"
  | "pending_emission"
  | "delayed"
  | "onboarding"
  | "inactive";

export type Periodicidad = "monthly" | "weekly" | "quarterly" | "yearly" | "one_time";

export type FormaDePago = "bank_transfer" | "card" | "cash" | "check" | "other";

export type OrigenCliente = "referral" | "web" | "event" | "cold_outreach" | "partner" | "other";

export interface ClientRecord {
  /** Domain fields (Spanish per initial_idea.md). */
  nombre: string;
  estatus: ClientStatus;
  origen: OrigenCliente;
  numeroId: string;
  idCliente: string;
  fechaDeContacto: string; // ISO date (YYYY-MM-DD)
  fechaDeInicio: string | null;
  fechaDeEmision: string | null;
  pagoTotal: number; // in minor units or absolute — stored as number, non-negative
  periodicidad: Periodicidad;
  formaDePago: FormaDePago;
  observaciones: string;

  /** Metadata (not user-editable through updateClient). */
  createdAt: string;
  updatedAt: string;
}

/** Fields the agent is allowed to patch via `updateClient`. */
export const CLIENT_UPDATABLE_FIELDS = [
  "nombre",
  "estatus",
  "origen",
  "fechaDeContacto",
  "fechaDeInicio",
  "fechaDeEmision",
  "pagoTotal",
  "periodicidad",
  "formaDePago",
  "observaciones"
] as const;

export type ClientUpdatableField = (typeof CLIENT_UPDATABLE_FIELDS)[number];

/** Shared demo tenant metadata stored at `tenant:demo`. */
export interface TenantRecord {
  id: TenantId;
  seededAt: string | null;
  version: number;
}

/** Encrypted binding of a Telegram chatId → demo tenant. */
export interface ChatBinding {
  chatId: number;
  tenantId: TenantId;
  boundAt: string;
  inviteCodeHash: string; // sha256 hex of invite code used to bind (no plaintext)
}

export type ChatEventRole = "system" | "user" | "assistant";

export interface ChatEvent {
  chatId: number;
  role: ChatEventRole;
  content: string;
  at: string; // ISO timestamp
  /** Optional tool call trace, never user PII beyond what was already sent. */
  toolCalls?: Array<{ name: string; argsSummary: string }>;
}

/** Daily memory summary, one per YYYY-MM-DD. */
export interface DailyMemorySummary {
  date: string; // YYYY-MM-DD
  summary: string;
  messageCount: number;
  updatedAt: string;
}

/** Ciphertext envelope written to 0G. */
export interface EncryptedEnvelope {
  v: 1;
  iv: string; // base64
  tag: string; // base64 (GCM auth tag)
  ct: string; // base64 ciphertext
  alg: "AES-256-GCM";
}
