import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

export const db =
  databaseUrl && databaseUrl.length > 0
    ? drizzle(neon(databaseUrl), { schema })
    : null;

export function getDb() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured. Add it to .env.local before using persistence.");
  }

  return db;
}
