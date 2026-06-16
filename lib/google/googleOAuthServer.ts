import { randomBytes } from "crypto";
import type { AccountRole, PrototypeAccount } from "@/components/golfalign/types";

const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";
const googleScope = "openid email profile";

export type GoogleOAuthRole = Extract<AccountRole, "member" | "pro">;

export type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getGoogleRedirectUri() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI ?? `${getAppUrl()}/api/auth/google/callback`;
}

export function createGoogleState(role: GoogleOAuthRole) {
  return `${role}.${randomBytes(16).toString("hex")}`;
}

export function readRoleFromState(state: string): GoogleOAuthRole | undefined {
  const [role] = state.split(".");
  return role === "member" || role === "pro" ? role : undefined;
}

export function buildGoogleAuthUrl(state: string) {
  const url = new URL(googleAuthUrl);
  url.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", getGoogleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", googleScope);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  return url;
}

export async function exchangeGoogleCode(code: string) {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri()
    })
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google OAuth token response did not include access_token.");
  }

  return data.access_token;
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(googleUserInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google userinfo request failed: ${response.status}`);
  }

  const userInfo = (await response.json()) as GoogleUserInfo;
  if (!userInfo.sub) {
    throw new Error("Google userinfo response did not include sub.");
  }

  return userInfo;
}

export function createGoogleAccount(userInfo: GoogleUserInfo, role: GoogleOAuthRole): PrototypeAccount {
  const loginId = userInfo.email ?? `google_${userInfo.sub}`;
  return {
    id: `google_${userInfo.sub}`,
    username: loginId,
    loginId,
    authProvider: "google",
    emailVerified: Boolean(userInfo.email_verified),
    role,
    displayName: userInfo.name ?? loginId
  };
}
