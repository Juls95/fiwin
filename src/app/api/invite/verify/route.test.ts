import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/invite/verify/route";

function makeReq(body: unknown): Request {
  return new Request("https://test/api/invite/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/invite/verify", () => {
  it("returns safe instructions on valid code — no secrets", async () => {
    const res = await POST(makeReq({ code: "test-invite-code" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.instructions).toBeTruthy();

    const blob = JSON.stringify(json).toLowerCase();
    // Must NOT leak any secret.
    expect(blob).not.toContain("123456:test-bot-token");
    expect(blob).not.toContain("test-webhook-secret");
    expect(blob).not.toContain(process.env.DEMO_ENCRYPTION_KEY!.toLowerCase());
    expect(blob).not.toContain(process.env.ZEROG_PRIVATE_KEY!.toLowerCase());
    expect(blob).not.toMatch(/zeroG_private_key|bot_token|webhook_secret|encryption_key/i);
    // It's fine (and intended) to include the public bot username + deep link.
    expect(json.instructions.botUsername).toMatch(/^@/);
  });

  it("rejects invalid codes with 401", async () => {
    const res = await POST(makeReq({ code: "nope-nope" }));
    expect(res.status).toBe(401);
  });

  it("rejects malformed bodies with 400", async () => {
    const res = await POST(makeReq({ not_code: 1 }));
    expect(res.status).toBe(400);
  });
});
