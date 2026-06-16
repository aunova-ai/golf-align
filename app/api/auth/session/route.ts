import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeAuthSession, sessionCookieName } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const session = decodeAuthSession(cookieStore.get(sessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({
    ok: true,
    account: session.account,
    sheetSynced: session.sheetSynced ?? false
  });
}
