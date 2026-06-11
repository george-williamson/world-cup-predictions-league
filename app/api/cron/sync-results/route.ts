import { NextRequest, NextResponse } from "next/server";

import { isCronRequest } from "@/lib/cron-auth";
import { syncResultsForDate } from "@/lib/sync/results";

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

  const date = request.nextUrl.searchParams.get("date") ?? todayIsoDate();

  try {
    const summary = await syncResultsForDate(date);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Result sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
