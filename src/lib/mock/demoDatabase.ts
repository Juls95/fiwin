import type { ClientRecord } from "@/lib/types/domain";

/**
 * DEMO SEED DATA — NOT A RUNTIME DATA SOURCE.
 *
 * This file is consumed ONLY by seedDemoDatabase.ts during bootstrap.
 * Agent tools, orchestrator, and API routes MUST NOT import this file.
 * After seeding, all runtime reads go through 0G storage.
 *
 * Exactly five rows, each covering one plan theme:
 *   1. Active enterprise client with monthly payments
 *   2. Prospect from referral with recent contact
 *   3. Client awaiting document emission
 *   4. Delayed payment client with observations
 *   5. New onboarding client with start date
 */

const NOW = "2026-04-20T09:00:00.000Z";

export const DEMO_CLIENTS: readonly ClientRecord[] = [
  {
    // 1. Active enterprise client — monthly bank transfers
    nombre: "Acme Manufacturing S.A.",
    estatus: "active",
    origen: "partner",
    numeroId: "RFC-ACME-840521",
    idCliente: "CLT-0001",
    fechaDeContacto: "2024-11-03",
    fechaDeInicio: "2024-12-01",
    fechaDeEmision: "2026-04-01",
    pagoTotal: 12500,
    periodicidad: "monthly",
    formaDePago: "bank_transfer",
    observaciones:
      "Enterprise account. Auto-renewal in December. Primary contact: operations manager.",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    // 2. Prospect from referral — recent contact, no start date yet
    nombre: "Northwind Logistics",
    estatus: "prospect",
    origen: "referral",
    numeroId: "RFC-NRTH-910812",
    idCliente: "CLT-0002",
    fechaDeContacto: "2026-04-15",
    fechaDeInicio: null,
    fechaDeEmision: null,
    pagoTotal: 0,
    periodicidad: "one_time",
    formaDePago: "bank_transfer",
    observaciones:
      "Referred by Acme Manufacturing. Proposal draft sent; awaiting procurement review.",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    // 3. Client awaiting document emission
    nombre: "Sun & Salt Retail Group",
    estatus: "pending_emission",
    origen: "web",
    numeroId: "RFC-SNST-780304",
    idCliente: "CLT-0003",
    fechaDeContacto: "2026-03-20",
    fechaDeInicio: "2026-04-01",
    fechaDeEmision: null,
    pagoTotal: 4800,
    periodicidad: "quarterly",
    formaDePago: "card",
    observaciones:
      "Contract signed. Waiting on compliance team to emit tax document before first invoice.",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    // 4. Delayed payment client — observations matter
    nombre: "Rivera Construcciones",
    estatus: "delayed",
    origen: "cold_outreach",
    numeroId: "RFC-RVCO-650919",
    idCliente: "CLT-0004",
    fechaDeContacto: "2025-08-11",
    fechaDeInicio: "2025-09-01",
    fechaDeEmision: "2026-02-15",
    pagoTotal: 2750,
    periodicidad: "monthly",
    formaDePago: "check",
    observaciones:
      "Two invoices overdue (Feb, Mar). Finance contact unresponsive; escalate via account owner by end of week.",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    // 5. New onboarding client with start date
    nombre: "Helios Solar Cooperative",
    estatus: "onboarding",
    origen: "event",
    numeroId: "RFC-HLSL-200514",
    idCliente: "CLT-0005",
    fechaDeContacto: "2026-04-05",
    fechaDeInicio: "2026-05-01",
    fechaDeEmision: null,
    pagoTotal: 8200,
    periodicidad: "yearly",
    formaDePago: "bank_transfer",
    observaciones:
      "Met at CleanTech Expo 2026. Onboarding kit delivered; kickoff scheduled for May 1.",
    createdAt: NOW,
    updatedAt: NOW
  }
];

if (DEMO_CLIENTS.length !== 5) {
  // Compile-time guard against accidental drift.
  throw new Error(
    `[demoDatabase] expected exactly 5 seed clients, found ${DEMO_CLIENTS.length}`
  );
}
