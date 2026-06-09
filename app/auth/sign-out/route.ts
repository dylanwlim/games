import { NextResponse } from "next/server";

import { clearDwlSessionCookie } from "@/lib/dwl-auth-server";
import { getDwlSignOutUrl } from "@/lib/dwl-accounts";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  const returnPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(
    getDwlSignOutUrl({
      returnUrl: new URL(returnPath, requestUrl.origin).toString(),
    }),
    303,
  );

  clearDwlSessionCookie(response);

  return response;
}
