import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { matches, predictions, users } from "@/db/schema";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

async function main() {
  if (process.env.CONFIRM_PRODUCTION_RESET !== "true") {
    throw new Error("Set CONFIRM_PRODUCTION_RESET=true to clear demo users, predictions and sample results.");
  }

  const database = getDb();

  await database.delete(predictions);
  await database.delete(users);
  await database.update(matches).set({
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    actualOutcome: null,
    winningTeamId: null,
    resultProvider: null,
    resultProviderFixtureId: null,
    resultUpdatedAt: null,
    updatedAt: sql`now()`
  });

  console.log("Production database prepared: users, predictions and sample results cleared; fixtures, teams, rounds and odds preserved.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
