import { NextResponse } from "next/server";
import { InviteVerifyBodySchema } from "@/lib/validation/schemas";
import { verifyInviteCode } from "@/lib/invite/codes";
import { buildConnectInstructions } from "@/lib/telegram/instructions";

// 0G SDK + node crypto require the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = InviteVerifyBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  if (!verifyInviteCode(parsed.data.code)) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
  }

  // Safe instructions only — no secrets, no 0G keys, no bot token.
  const instructions = buildConnectInstructions(parsed.data.code);
  return NextResponse.json({ ok: true, instructions });
}
