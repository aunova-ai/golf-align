import { NextResponse } from "next/server";
import type { AccountRole } from "@/components/golfalign/types";
import { encodeAuthSession, sessionCookieName } from "@/lib/auth/session";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import {
  createGoogleAccount,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getAppUrl,
  readRoleFromState
} from "@/lib/google/googleOAuthServer";

const googleStateCookieName = "golfalign_google_state";

function nowIso() {
  return new Date().toISOString();
}

function redirectWithError(code: string) {
  const url = new URL(getAppUrl());
  url.searchParams.set("auth_error", code);
  return NextResponse.redirect(url);
}

function redirectHome() {
  return NextResponse.redirect(new URL(getAppUrl()));
}

async function appendGoogleAccountToSheets({
  account,
  email,
  pictureUrl
}: {
  account: ReturnType<typeof createGoogleAccount>;
  email: string;
  pictureUrl?: string;
}) {
  const createdAt = nowIso();

  await appendSheetRow("users!A:AB", [
    account.id,
    account.role,
    account.displayName,
    account.displayName,
    email,
    "",
    pictureUrl ? "google" : "drive",
    "",
    "",
    pictureUrl ?? "",
    pictureUrl ? createdAt : "",
    true,
    "ko",
    "",
    "",
    account.role === "pro" ? account.organization ?? "" : "",
    "",
    createdAt,
    createdAt,
    "active",
    createdAt,
    false,
    account.loginId ?? account.username,
    "",
    "",
    "google",
    account.emailVerified ?? false,
    createdAt
  ]);

  if (account.role === "pro") {
    await appendSheetRow("pro_profiles!A:N", [
      `pro_${Date.now()}`,
      account.id,
      account.displayName,
      account.organization ?? "",
      "",
      "Google 계정으로 생성된 프로 계정",
      "",
      "",
      "",
      "",
      true,
      createdAt,
      createdAt,
      "active"
    ]);
  }
}

async function findGoogleAccountInSheets(loginId: string): Promise<ReturnType<typeof createGoogleAccount> | undefined> {
  const rows = await readSheetRange("users!A:AB");
  const row = rows.slice(1).find((values) => values[22] === loginId && values[25] === "google");
  if (!row) {
    return undefined;
  }

  const role: Extract<AccountRole, "member" | "pro"> = row[1] === "pro" ? "pro" : "member";
  return {
    id: row[0] || `google_${Date.now()}`,
    username: row[22] || loginId,
    loginId: row[22] || loginId,
    authProvider: "google" as const,
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const savedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${googleStateCookieName}=`))
    ?.split("=")[1];

  if (!code || !state || !savedState || state !== decodeURIComponent(savedState)) {
    return redirectWithError("google_state_invalid");
  }

  const role = readRoleFromState(state);
  if (!role || (role as AccountRole) === "admin") {
    return redirectWithError("google_role_invalid");
  }

  try {
    const accessToken = await exchangeGoogleCode(code);
    const userInfo = await fetchGoogleUserInfo(accessToken);
    const fallbackAccount = createGoogleAccount(userInfo, role);
    let account = fallbackAccount;
    let sheetSynced = false;

    if (isGoogleSheetsWriteConfigured()) {
      const existingAccount = await findGoogleAccountInSheets(fallbackAccount.loginId ?? fallbackAccount.username);
      if (existingAccount) {
        account = existingAccount;
      } else {
        await appendGoogleAccountToSheets({
          account,
          email: userInfo.email ?? "",
          pictureUrl: userInfo.picture
        });
      }
      sheetSynced = true;
    }

    const response = redirectHome();
    response.cookies.set(sessionCookieName, encodeAuthSession({ account, sheetSynced }), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
      sameSite: "lax"
    });
    response.cookies.delete(googleStateCookieName);
    return response;
  } catch {
    return redirectWithError("google_login_failed");
  }
}
