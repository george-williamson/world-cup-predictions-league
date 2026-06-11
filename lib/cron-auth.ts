import { NextRequest } from "next/server";

export function isCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const header = request.headers.get("x-cron-secret");

  return bearer === secret || header === secret;
}
