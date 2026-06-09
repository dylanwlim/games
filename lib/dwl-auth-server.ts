import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { DWL_ACCOUNTS_URL, DWL_APP_ID, type DwlAccountUser } from "@/lib/dwl-accounts";

export type DwlProductSession = {
  expiresAt: number;
  issuedAt: number;
  user: DwlAccountUser;
};

const COOKIE_NAME = "games_dwl_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getAppSecret() {
  return process.env.DWL_APP_SECRET?.trim() ?? "";
}

function signPayload(payload: string) {
  return createHmac("sha256", getAppSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = Buffer.from(signPayload(payload));
  const provided = Buffer.from(signature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function createSessionToken(user: DwlAccountUser) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const session: DwlProductSession = {
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
    issuedAt,
    user,
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function parseSessionToken(token: string | undefined): DwlProductSession | null {
  if (!getAppSecret() || !token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DwlProductSession;
    return session.expiresAt > Math.floor(Date.now() / 1000) ? session : null;
  } catch {
    return null;
  }
}

export async function getDwlSession() {
  const cookieStore = await cookies();
  return parseSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function setDwlSessionCookie(response: NextResponse, user: DwlAccountUser) {
  response.cookies.set(COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearDwlSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function exchangeDwlAuthCode(code: string) {
  const appSecret = getAppSecret();
  if (!appSecret) {
    throw new Error("DWL_APP_SECRET is not configured.");
  }

  const response = await fetch(new URL("/api/app-auth/exchange", DWL_ACCOUNTS_URL), {
    body: JSON.stringify({ app: DWL_APP_ID, code }),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${appSecret}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    user?: DwlAccountUser;
  };

  if (!response.ok || !body.user) {
    throw new Error(body.error ?? "DWL Accounts did not return a session.");
  }

  return body.user;
}

export async function readDwlAppState(stateKey: string) {
  const session = await getDwlSession();
  const appSecret = getAppSecret();
  if (!session || !appSecret) {
    return null;
  }

  const url = new URL("/api/app-state", DWL_ACCOUNTS_URL);
  url.searchParams.set("app", DWL_APP_ID);
  url.searchParams.set("key", stateKey);
  url.searchParams.set("userId", session.user.id);

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${appSecret}` },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { state: unknown; updatedAt: string | null };
}

export async function writeDwlAppState(stateKey: string, state: unknown) {
  const session = await getDwlSession();
  const appSecret = getAppSecret();
  if (!session || !appSecret) {
    return null;
  }

  const response = await fetch(new URL("/api/app-state", DWL_ACCOUNTS_URL), {
    body: JSON.stringify({
      app: DWL_APP_ID,
      key: stateKey,
      state,
      userId: session.user.id,
    }),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${appSecret}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { state: unknown; updatedAt: string | null };
}
