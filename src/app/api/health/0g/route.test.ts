import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regenerate the mocks per test so we can programmatically break storage
 * or compute and verify the route reports a 503 failure.
 */
function reloadWithMocks(opts: { storageFail?: boolean; computeFail?: boolean }) {
  vi.resetModules();
  vi.doMock("@/lib/storage/zeroGStorage", async () => ({
    storageHealthCheck: opts.storageFail
      ? async () => {
          throw new Error("storage offline");
        }
      : async () => undefined
  }));
  vi.doMock("@/lib/agent/model0g", async () => ({
    computeHealthCheck: opts.computeFail
      ? async () => {
          throw new Error("compute offline");
        }
      : async () => undefined,
    chatCompletion: async () => ({ content: "" }),
    __resetComputeClients: () => {}
  }));
}

describe("GET /api/health/0g", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reports 200 when env + storage + compute all succeed", async () => {
    reloadWithMocks({});
    const mod = await import("@/app/api/health/0g/route");
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.checks.storage.ok).toBe(true);
    expect(json.checks.compute.ok).toBe(true);
  });

  it("reports 503 when 0G Storage is unavailable", async () => {
    reloadWithMocks({ storageFail: true });
    const mod = await import("@/app/api/health/0g/route");
    const res = await mod.GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.checks.storage.ok).toBe(false);
  });

  it("reports 503 when 0G Compute is unavailable", async () => {
    reloadWithMocks({ computeFail: true });
    const mod = await import("@/app/api/health/0g/route");
    const res = await mod.GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.checks.compute.ok).toBe(false);
  });
});
