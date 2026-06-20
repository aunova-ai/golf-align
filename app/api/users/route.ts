import { NextResponse } from "next/server";
import type { AccountRole, PrototypeAccount } from "@/components/golfalign/types";
import { encodeAuthSession, sessionCookieName } from "@/lib/auth/session";
import { appendSheetRow, hashPassword, isGoogleSheetsWriteConfigured, readSheetRange, updateSheetValues } from "@/lib/google/googleSheetsServer";
import { createLocalAccount, updateLocalAccountProfile } from "@/lib/local/prototypeDbServer";
import { canUseServerLocalPrototypeDb, serverLocalDbUnavailableResponse } from "@/lib/local/serverDbMode";
import { resolveProfileImageForAccount } from "@/lib/mock/profileImages";

type CreateUserRequest = {
  displayName?: string;
  organization?: string;
  password?: string;
  phone?: string;
  role?: AccountRole;
  username?: string;
};

type UpdateUserRequest = {
  bio?: string;
  displayName?: string;
  golfExperience?: string;
  id?: string;
  mainGoal?: string;
  organization?: string;
  phone?: string;
  profileImageUrl?: string;
};

function isAllowedRole(role: unknown): role is AccountRole {
  return role === "member" || role === "pro" || role === "admin";
}

function setSessionCookie(response: NextResponse, account: PrototypeAccount, sheetSynced: boolean) {
  response.cookies.set(sessionCookieName, encodeAuthSession({ account, sheetSynced }), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
    sameSite: "lax"
  });
}

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateUserRequest;
  const username = body.username?.trim() ?? "";
  const displayName = body.displayName?.trim() ?? "";
  const password = body.password ?? "";
  const role = body.role ?? "member";

  if (!username || !displayName || !password) {
    return NextResponse.json({ ok: false, message: "필수 가입 정보를 입력해 주세요." }, { status: 400 });
  }

  if (!isAllowedRole(role) || role === "admin") {
    return NextResponse.json({ ok: false, message: "회원 또는 프로만 가입할 수 있습니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    if (!canUseServerLocalPrototypeDb()) {
      return NextResponse.json(serverLocalDbUnavailableResponse(), { status: 503 });
    }

    const result = await createLocalAccount({
      displayName,
      organization: body.organization,
      password,
      phone: body.phone,
      role,
      username
    });

    return NextResponse.json({
      ok: true,
      account: result.account,
      created: result.created,
      mode: "local_prototype",
      user: {
        id: result.account.id,
        role: result.account.role,
        loginId: result.account.loginId,
        displayName: result.account.displayName
      }
    });
  }

  const id = `usr_${Date.now()}`;
  const createdAt = nowIso();
  const { hash, salt } = hashPassword(password);
  const profileImageUrl = resolveProfileImageForAccount({ id, role }, Date.now());

  await appendSheetRow("users!A:AB", [
    id,
    role,
    displayName,
    displayName,
    "",
    body.phone?.trim() ?? "",
    "drive",
    "",
    "",
    profileImageUrl,
    createdAt,
    true,
    "ko",
    "",
    "",
    role === "pro" ? body.organization?.trim() ?? "" : "",
    "",
    createdAt,
    createdAt,
    "active",
    "",
    false,
    username,
    hash,
    salt,
    "local",
    false,
    createdAt
  ]);

  if (role === "pro") {
    await appendSheetRow("pro_profiles!A:J", [
      `pro_${Date.now()}`,
      id,
      displayName,
      body.organization?.trim() ?? "",
      "",
      "indoor,online",
      true,
      createdAt,
      createdAt,
      "active"
    ]);
  }

  return NextResponse.json({
    ok: true,
    user: {
      id,
      role,
      loginId: username,
      displayName,
      profileImageUrl
    }
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as UpdateUserRequest;
  const id = body.id?.trim() ?? "";

  if (!id) {
    return NextResponse.json({ ok: false, message: "수정할 계정 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    if (!canUseServerLocalPrototypeDb()) {
      return NextResponse.json(serverLocalDbUnavailableResponse(), { status: 503 });
    }

    const account = await updateLocalAccountProfile({
      bio: body.bio,
      displayName: body.displayName,
      golfExperience: body.golfExperience,
      id,
      mainGoal: body.mainGoal,
      organization: body.organization,
      phone: body.phone,
      profileImageUrl: body.profileImageUrl
    });

    if (!account) {
      return NextResponse.json({ ok: false, message: "계정을 찾을 수 없습니다." }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true, account, mode: "local_prototype" });
    setSessionCookie(response, account, false);
    return response;
  }

  const rows = await readSheetRange("users!A:AB");
  const rowIndex = rows.slice(1).findIndex((row) => row[0] === id);
  if (rowIndex < 0) {
    return NextResponse.json({ ok: false, message: "계정을 찾을 수 없습니다." }, { status: 404 });
  }

  const sheetRowNumber = rowIndex + 2;
  const row = [...rows[rowIndex + 1]];
  while (row.length < 28) {
    row.push("");
  }

  const now = nowIso();
  row[2] = body.displayName?.trim() || row[2];
  row[3] = body.displayName?.trim() || row[3];
  row[5] = body.phone?.trim() || row[5];
  row[9] = body.profileImageUrl?.trim() || row[9];
  row[10] = body.profileImageUrl ? now : row[10];
  row[13] = body.golfExperience?.trim() || row[13];
  row[15] = body.mainGoal?.trim() || body.organization?.trim() || row[15];
  row[16] = body.bio?.trim() || row[16];
  row[18] = now;

  await updateSheetValues(`users!A${sheetRowNumber}:AB${sheetRowNumber}`, [row]);

  const role: AccountRole = row[1] === "pro" ? "pro" : row[1] === "admin" ? "admin" : "member";
  const account: PrototypeAccount = {
    id: row[0],
    username: row[22] || row[4] || row[0],
    loginId: row[22] || row[4] || row[0],
    authProvider: row[25] === "google" ? "google" : "local",
    emailVerified: row[26] === "true" || row[26] === "TRUE",
    role,
    displayName: row[2] || row[3] || row[0],
    phone: row[5] || "",
    organization: role === "pro" ? row[15] || "" : undefined,
    profileImageUrl: row[9] || "",
    golfExperience: row[13] || "",
    mainGoal: role === "member" ? row[15] || "" : "",
    bio: row[16] || ""
  };

  const response = NextResponse.json({ ok: true, account });
  setSessionCookie(response, account, true);
  return response;
}
