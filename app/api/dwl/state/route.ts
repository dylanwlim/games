import { NextResponse } from "next/server";

import {
  readDwlAppState,
  writeDwlAppState,
} from "@/lib/dwl-auth-server";

export const dynamic = "force-dynamic";

const STATE_KEY = "progress";

export async function GET() {
  const result = await readDwlAppState(STATE_KEY);

  return NextResponse.json({
    state: result?.state ?? null,
    updatedAt: result?.updatedAt ?? null,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as { state?: unknown } | null;

  if (!body || typeof body !== "object" || !("state" in body)) {
    return NextResponse.json({ error: "Missing state." }, { status: 400 });
  }

  const result = await writeDwlAppState(STATE_KEY, body.state);

  return NextResponse.json({
    state: result?.state ?? null,
    updatedAt: result?.updatedAt ?? null,
  });
}
