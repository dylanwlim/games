import { NextResponse } from "next/server";

import {
  exchangeDwlAuthCode,
  setDwlSessionCookie,
} from "@/lib/dwl-auth-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  const code = requestUrl.searchParams.get("code");
  const target = new URL(
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/",
    requestUrl.origin,
  );

  if (!code) {
    target.searchParams.set("dwl_auth", "missing-code");
    return NextResponse.redirect(target, 303);
  }

  try {
    const user = await exchangeDwlAuthCode(code);
    const response = NextResponse.redirect(target, 303);
    setDwlSessionCookie(response, user);
    return response;
  } catch (error) {
    target.searchParams.set("dwl_auth", "error");
    target.searchParams.set(
      "auth_error",
      error instanceof Error ? error.message : "DWL sign-in failed.",
    );
  }

  return NextResponse.redirect(target, 303);
}
