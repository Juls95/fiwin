/**
 * Phase 4 placeholder. The actual seed implementation is filled in Phase 4.
 *
 * This file's sole purpose right now is to make the dynamic import in
 * src/lib/storage/bootstrap.ts resolvable at type-check time without
 * causing bootstrap.ts to statically depend on demoDatabase.ts (which would
 * violate the "tools must not import seed data" rule).
 */
export async function seedDemoDatabase(): Promise<void> {
  throw new Error("[seed] seedDemoDatabase is not implemented yet (Phase 4).");
}
