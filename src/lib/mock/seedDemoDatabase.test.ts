import { describe, it, expect, beforeEach } from "vitest";
import { __memStore } from "@/test/setupEnv";
import { seedDemoDatabase } from "@/lib/mock/seedDemoDatabase";
import { K } from "@/lib/storage/keys";
import { readEncryptedJSON } from "@/lib/storage/zeroGStorage";

describe("seedDemoDatabase", () => {
  beforeEach(() => {
    __memStore.clear();
  });

  it("writes exactly 5 seed rows + clients:index when index is missing", async () => {
    await seedDemoDatabase();
    const idx = await readEncryptedJSON<string[]>(K.clientsIndex());
    expect(idx).toBeTruthy();
    expect(idx!.length).toBe(5);
    for (const id of idx!) {
      const rec = await readEncryptedJSON(K.client(id));
      expect(rec).toBeTruthy();
    }
  });

  it("is a no-op when clients:index already exists", async () => {
    await seedDemoDatabase();
    const firstCount = __memStore.size;
    await seedDemoDatabase();
    expect(__memStore.size).toBe(firstCount);
  });
});
