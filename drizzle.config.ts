import { defineConfig } from "drizzle-kit";

import { loadLocalEnv } from "./lib/load-env";

loadLocalEnv();

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? ""
  }
});
