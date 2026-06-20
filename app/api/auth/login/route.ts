import { NextResponse } from "next/server";
import type { AccountRole, PrototypeAccount } from "@/components/golfalign/types";
import { createAdminAccount, isAdminCredential } from "@/lib/auth/adminAccount";
import { encodeAuthSession, sessionCookieName } from "@/lib/auth/session";
import { isGoogleSheetsWriteConfigured, readSheetRange, verifyPassword } from "@/lib/google/googleSheetsServer";
import { findLocalAccount } from "@/lib/local/prototypeDbServer";
import { canUseServerLocalPrototypeDb, serverLocalDbUnavailableResponse } from "@/lib/local/serverDbMode";

type LoginRequest = {
  password?: string;
  username?: string;
};

function mapUserRowToAccount(row: string[]): PrototypeAccount {
  const role: AccountRole = row[1] === "pro" ? "pro" : row[1] === "admin" ? "admin" : "member";
  const loginId = row[22] || row[4] || row[0];

  return {
    id: row[0],
    username: loginId,
    loginId,
    passwordHash: row[23] || "",
    passwordSalt: row[24] || "",
    authProvider: row[25] === "google" ? "google" : "local",
    emailVerified: row[26] === "true" || row[26] === "TRUE",
    role,
    displayName: row[2] || row[3] || loginId,
    phone: row[5] || "",
    organization: role === "pro" ? row[15] || "" : "",
    profileImageUrl: row[9] || "",
    golfExperience: row[13] || "",
    mainGoal: role === "member" ? row[15] || "" : "",
    bio: row[16] || ""
  };
}

function setSessionCookie(response: NextResponse, account: PrototypeAccount, sheetSynced: boolean) {
  response.cookies.set(sessionCookieName, encodeAuthSession({ account, sheetSynced }), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
    sameSite: "lax"
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ ok: false, message: "아이디와 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  if (isAdminCredential(username, password)) {
    const account = createAdminAccount();
    const response = NextResponse.json({ ok: true, account, mode: "admin" });
    setSessionCookie(response, account, true);
    return response;
  }

  if (!isGoogleSheetsWriteConfigured()) {
    if (!canUseServerLocalPrototypeDb()) {
      return NextResponse.json(serverLocalDbUnavailableResponse(), { status: 503 });
    }

    const account = await findLocalAccount(username, password);

    if (!account) {
      return NextResponse.json(
        {
          ok: false,
          code: "LOCAL_ACCOUNT_NOT_FOUND",
          message: "가입된 로컬 테스트 계정을 찾을 수 없습니다.",
          mode: "local_prototype"
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ ok: true, account, mode: "local_prototype" });
    setSessionCookie(response, account, false);
    return response;
  }

  const rows = await readSheetRange("users!A:AB");
  const matchedRow = rows
    .slice(1)
    .find((row) => (row[22] || row[4] || "").trim() === username && (row[25] || "local") === "local");

  if (!matchedRow) {
    return NextResponse.json({ ok: false, message: "가입된 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  const account = mapUserRowToAccount(matchedRow);
  if (!verifyPassword(password, account.passwordSalt ?? "", account.passwordHash ?? "")) {
    return NextResponse.json({ ok: false, message: "아이디 또는 비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, account });
  setSessionCookie(response, account, true);
  return response;
}
