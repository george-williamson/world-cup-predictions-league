import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { matches } from "@/db/schema";

const [matchId, homeScoreInput, awayScoreInput] = process.argv.slice(2);

if (!matchId || homeScoreInput === undefined || awayScoreInput === undefined) {
  console.error("Usage: pnpm results:update <match-id> <home-score> <away-score>");
  process.exit(1);
}

const homeScore = Number(homeScoreInput);
const awayScore = Number(awayScoreInput);

if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
  console.error("Scores must be integers.");
  process.exit(1);
}

const actualOutcome = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";

async function main() {
  const database = getDb();

  await database
    .update(matches)
    .set({
      status: "final",
      homeScore,
      awayScore,
      actualOutcome,
      updatedAt: sql`now()`
    })
    .where(eq(matches.id, matchId));

  console.log(`Updated ${matchId}: ${homeScore}-${awayScore} (${actualOutcome}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
