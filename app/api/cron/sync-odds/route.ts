import { NextRequest, NextResponse } from "next/server";

import { isCronRequest } from "@/lib/cron-auth";
import { syncOdds } from "@/lib/sync/odds";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncOdds();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Odds sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
