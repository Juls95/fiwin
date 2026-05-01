import { K } from "@/lib/storage/keys";
import {
  keyExists,
  readEncryptedJSON,
  writeEncryptedJSON
} from "@/lib/storage/zeroGStorage";
import type { TenantRecord } from "@/lib/types/domain";
import { TENANT_ID } from "@/lib/types/domain";

/**
 * Bootstrap the shared demo tenant on 0G.
 *
 * Seeds tenant:demo + clients:index ONLY if they don't already exist.
 * The actual client seed rows are inserted by seedDemoDatabase.ts, which
 * is called from here when `clients:index` is missing.
 *
 * After this function returns, every runtime read MUST use 0G — never
 * demoDatabase.ts.
 */

export interface BootstrapResult {
  tenantSeeded: boolean;
  clientsSeeded: boolean;
}

export async function bootstrapDemoTenant(): Promise<BootstrapResult> {
  let tenantSeeded = false;
  let clientsSeeded = false;

  const tenantKey = K.tenantDemo();
  const existingTenant = await readEncryptedJSON<TenantRecord>(tenantKey);
  if (!existingTenant) {
    const record: TenantRecord = {
      id: TENANT_ID,
      seededAt: null,
      version: 1
    };
    await writeEncryptedJSON(tenantKey, record);
    tenantSeeded = true;
  }

  const hasIndex = await keyExists(K.clientsIndex());
  if (!hasIndex) {
    // Lazy import keeps demoDatabase out of any non-seed path by default.
    const { seedDemoDatabase } = await import("@/lib/mock/seedDemoDatabase");
    await seedDemoDatabase();
    // Mark tenant as seeded.
    const tenant = (await readEncryptedJSON<TenantRecord>(tenantKey)) ?? {
      id: TENANT_ID,
      seededAt: null,
      version: 1
    };
    tenant.seededAt = new Date().toISOString();
    await writeEncryptedJSON(tenantKey, tenant);
    clientsSeeded = true;
  }

  return { tenantSeeded, clientsSeeded };
}
