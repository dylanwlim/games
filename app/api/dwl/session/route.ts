import { NextResponse } from "next/server";

import { getDwlSession } from "@/lib/dwl-auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getDwlSession();

  return NextResponse.json({
    user: session?.user ?? null,
  });
}
