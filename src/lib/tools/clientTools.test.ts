import { describe, it, expect, beforeEach } from "vitest";
import { __memStore } from "@/test/setupEnv";
import {
  listClients,
  getClient,
  createClient,
  updateClient
} from "@/lib/tools/clientTools";
import { seedDemoDatabase } from "@/lib/mock/seedDemoDatabase";
import { K } from "@/lib/storage/keys";

describe("clientTools go through 0G (mock) with deterministic keys", () => {
  beforeEach(async () => {
    __memStore.clear();
    await seedDemoDatabase();
  });

  it("listClients reads clients:index + clients:{id}", async () => {
    const list = await listClients();
    expect(list.length).toBe(5);
    // Reads use the deterministic keys.
    for (const c of list) {
      expect(__memStore.has(K.client(c.idCliente))).toBe(true);
    }
    expect(__memStore.has(K.clientsIndex())).toBe(true);
  });

  it("getClient reads one clients:{id}", async () => {
    const c = await getClient({ idCliente: "CLT-0001" });
    expect(c?.idCliente).toBe("CLT-0001");
    const missing = await getClient({ idCliente: "CLT-9999" });
    expect(missing).toBeNull();
  });

  it("createClient writes clients:{id} and updates clients:index", async () => {
    const created = await createClient({
      nombre: "Test Co",
      estatus: "prospect",
      origen: "referral",
      numeroId: "RFC-TEST-000001",
      idCliente: "CLT-T001",
      fechaDeContacto: "2026-05-01",
      fechaDeInicio: null,
      fechaDeEmision: null,
      pagoTotal: 100,
      periodicidad: "monthly",
      formaDePago: "bank_transfer",
      observaciones: "new"
    });
    expect(created.idCliente).toBe("CLT-T001");
    expect(__memStore.has(K.client("CLT-T001"))).toBe(true);
    const all = await listClients();
    expect(all.find((c) => c.idCliente === "CLT-T001")).toBeTruthy();
  });

  it("updateClient cannot change idCliente or createdAt", async () => {
    const before = await getClient({ idCliente: "CLT-0001" });
    const updated = await updateClient({
      idCliente: "CLT-0001",
      patch: { observaciones: "updated note" }
    });
    expect(updated.observaciones).toBe("updated note");
    expect(updated.idCliente).toBe(before!.idCliente);
    expect(updated.createdAt).toBe(before!.createdAt);
    expect(updated.updatedAt).not.toBe(before!.updatedAt);
  });

  it("updateClient rejects non-allowlisted fields (e.g. createdAt)", async () => {
    await expect(
      updateClient({
        idCliente: "CLT-0001",
        // @ts-expect-error — intentionally passing a forbidden key
        patch: { createdAt: "1999-01-01T00:00:00.000Z" }
      })
    ).rejects.toThrow();
  });
});
