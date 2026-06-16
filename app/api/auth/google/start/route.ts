import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createGoogleState,
  getAppUrl,
  isGoogleOAuthConfigured,
  type GoogleOAuthRole
} from "@/lib/google/googleOAuthServer";

const googleStateCookieName = "golfalign_google_state";

function redirectWithError(code: string) {
  const url = new URL(getAppUrl());
  url.searchParams.set("auth_error", code);
  return NextResponse.redirect(url);
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const requestedRole = url.searchParams.get("role");
  const role: GoogleOAuthRole = requestedRole === "pro" ? "pro" : "member";

  if (!isGoogleOAuthConfigured()) {
    return redirectWithError("google_not_configured");
  }

  const state = createGoogleState(role);
  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set(googleStateCookieName, state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax"
  });
  return response;
}
