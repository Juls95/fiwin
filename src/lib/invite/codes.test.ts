import { describe, it, expect } from "vitest";
import { verifyInviteCode, hashInviteCode } from "@/lib/invite/codes";

describe("invite codes", () => {
  it("accepts the env-static invite code", () => {
    expect(verifyInviteCode("test-invite-code")).toBe(true);
  });

  it("rejects wrong codes", () => {
    expect(verifyInviteCode("wrong")).toBe(false);
    expect(verifyInviteCode("test-invite-cod")).toBe(false);
    expect(verifyInviteCode("test-invite-codex")).toBe(false);
  });

  it("rejects non-strings / empty", () => {
    expect(verifyInviteCode(null)).toBe(false);
    expect(verifyInviteCode(undefined)).toBe(false);
    expect(verifyInviteCode("")).toBe(false);
    expect(verifyInviteCode(123)).toBe(false);
  });

  it("hashInviteCode is deterministic sha256 hex", () => {
    const h = hashInviteCode("test-invite-code");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toEqual(hashInviteCode("test-invite-code"));
  });
});
