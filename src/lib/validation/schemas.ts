import { z } from "zod";
import { CLIENT_UPDATABLE_FIELDS } from "@/lib/types/domain";

/**
 * Runtime-validated schemas for:
 *  - Invite codes
 *  - Telegram payloads (subset we care about)
 *  - Client records and update patches
 *  - Tool inputs
 *
 * Keep every externally-sourced value (env, HTTP body, tool args) passing
 * through one of these before it hits business logic.
 */

/* ------------------------------ invite ------------------------------ */

export const InviteCodeSchema = z
  .string()
  .trim()
  .min(4, "invite code too short")
  .max(128, "invite code too long");

export const InviteVerifyBodySchema = z.object({
  code: InviteCodeSchema
});

/* ---------------------------- telegram ----------------------------- */

/**
 * We only model the fields we actually read. Telegram may include far more.
 * Unknown fields are ignored by default (non-strict).
 */
export const TelegramChatSchema = z.object({
  id: z.number().int(),
  type: z.string().optional()
});

export const TelegramFromSchema = z.object({
  id: z.number().int(),
  is_bot: z.boolean().optional(),
  username: z.string().optional(),
  first_name: z.string().optional()
});

export const TelegramMessageSchema = z.object({
  message_id: z.number().int(),
  date: z.number().int(),
  chat: TelegramChatSchema,
  from: TelegramFromSchema.optional(),
  text: z.string().optional()
});

export const TelegramUpdateSchema = z.object({
  update_id: z.number().int(),
  message: TelegramMessageSchema.optional(),
  edited_message: TelegramMessageSchema.optional()
});

export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;

/* ------------------------------ client ----------------------------- */

export const ClientStatusSchema = z.enum([
  "active",
  "prospect",
  "pending_emission",
  "delayed",
  "onboarding",
  "inactive"
]);

export const PeriodicidadSchema = z.enum([
  "monthly",
  "weekly",
  "quarterly",
  "yearly",
  "one_time"
]);

export const FormaDePagoSchema = z.enum([
  "bank_transfer",
  "card",
  "cash",
  "check",
  "other"
]);

export const OrigenClienteSchema = z.enum([
  "referral",
  "web",
  "event",
  "cold_outreach",
  "partner",
  "other"
]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const isoDateNullable = isoDate.nullable();

export const ClientRecordSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  estatus: ClientStatusSchema,
  origen: OrigenClienteSchema,
  numeroId: z.string().trim().min(1).max(64),
  idCliente: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "idCliente must be alphanumeric/_/-"),
  fechaDeContacto: isoDate,
  fechaDeInicio: isoDateNullable,
  fechaDeEmision: isoDateNullable,
  pagoTotal: z.number().finite().nonnegative(),
  periodicidad: PeriodicidadSchema,
  formaDePago: FormaDePagoSchema,
  observaciones: z.string().max(4000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const ClientCreateInputSchema = ClientRecordSchema.omit({
  createdAt: true,
  updatedAt: true
});

export const ClientUpdatePatchSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200).optional(),
    estatus: ClientStatusSchema.optional(),
    origen: OrigenClienteSchema.optional(),
    fechaDeContacto: isoDate.optional(),
    fechaDeInicio: isoDateNullable.optional(),
    fechaDeEmision: isoDateNullable.optional(),
    pagoTotal: z.number().finite().nonnegative().optional(),
    periodicidad: PeriodicidadSchema.optional(),
    formaDePago: FormaDePagoSchema.optional(),
    observaciones: z.string().max(4000).optional()
  })
  .strict()
  .refine(
    (patch) => Object.keys(patch).length > 0,
    "update patch must include at least one field"
  )
  .refine((patch) => {
    // Defense in depth: every key MUST be in the allowlist.
    const allowed = new Set<string>(CLIENT_UPDATABLE_FIELDS);
    return Object.keys(patch).every((k) => allowed.has(k));
  }, "update patch contains a non-updatable field");

/* ---------------------------- tool inputs --------------------------- */

export const ListClientsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional()
});

export const GetClientInputSchema = z.object({
  idCliente: z.string().trim().min(1)
});

export const CreateClientInputSchema = ClientCreateInputSchema;

export const UpdateClientInputSchema = z.object({
  idCliente: z.string().trim().min(1),
  patch: ClientUpdatePatchSchema
});

export const SummarizeClientInputSchema = z.object({
  idCliente: z.string().trim().min(1)
});

export const RecallConversationInputSchema = z.object({
  chatId: z.number().int(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .optional()
});

/* ------------------------------ chat ------------------------------ */

export const ChatEventSchema = z.object({
  chatId: z.number().int(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
  at: z.string().datetime(),
  toolCalls: z
    .array(z.object({ name: z.string(), argsSummary: z.string() }))
    .optional()
});

export const ChatBindingSchema = z.object({
  chatId: z.number().int(),
  tenantId: z.literal("demo"),
  boundAt: z.string().datetime(),
  inviteCodeHash: z.string().regex(/^[0-9a-f]{64}$/)
});

export const DailyMemorySummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string(),
  messageCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime()
});

/* ------------------------------ env -------------------------------- */

// Re-export a thin helper to keep a single import surface.
export { getEnv } from "@/lib/config/env";
