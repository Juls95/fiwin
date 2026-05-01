import { describe, it, expect } from "vitest";
import { encryptJSON, decryptJSON } from "@/lib/storage/encryption";

describe("encryption envelope", () => {
  it("round-trips arbitrary JSON without leaking plaintext", () => {
    const data = {
      client: "Acme",
      observaciones: "Highly sensitive note with number 42",
      nested: { a: [1, 2, 3] }
    };
    const env = encryptJSON(data);
    expect(env.v).toBe(1);
    expect(env.alg).toBe("AES-256-GCM");
    const serialized = JSON.stringify(env);
    // No plaintext field values appear anywhere in the envelope.
    expect(serialized).not.toContain("Acme");
    expect(serialized).not.toContain("Highly sensitive");
    expect(serialized).not.toContain("observaciones");

    const back = decryptJSON<typeof data>(env);
    expect(back).toEqual(data);
  });

  it("uses a fresh IV per call (ciphertexts differ for identical input)", () => {
    const a = encryptJSON({ x: 1 });
    const b = encryptJSON({ x: 1 });
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ct).not.toEqual(b.ct);
  });

  it("decryption fails if the auth tag is tampered", () => {
    const env = encryptJSON({ secret: "pw" });
    const bad = {
      ...env,
      tag: Buffer.from("0".repeat(env.tag.length)).toString("base64")
    };
    expect(() => decryptJSON(bad)).toThrow();
  });
});
