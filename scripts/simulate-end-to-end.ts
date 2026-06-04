import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { matches, predictions, users, type Match } from "@/db/schema";
import { getLeaderboard } from "@/lib/queries";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

type SnapshotMatch = Pick<Match, "id" | "status" | "homeScore" | "awayScore" | "actualOutcome" | "resultProvider" | "resultProviderFixtureId" | "resultUpdatedAt">;

async function main() {
  const database = getDb();
  const simulationId = randomUUID().slice(0, 8);
  const leaderEmail = `simulation.leader.${simulationId}@tomoro.ai`;
  const chaserEmail = `simulation.chaser.${simulationId}@tomoro.ai`;
  const leaderId = randomUUID();
  const chaserId = randomUUID();

  const targetMatches = await database
    .select()
    .from(matches)
    .where(eq(matches.type, "group"))
    .orderBy(asc(matches.kickoffAt), asc(matches.matchNumber))
    .limit(3);

  if (targetMatches.length < 3) {
    throw new Error("Need at least three group matches to run the simulation.");
  }

  const snapshots: SnapshotMatch[] = targetMatches.map((match) => ({
    id: match.id,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    actualOutcome: match.actualOutcome,
    resultProvider: match.resultProvider,
    resultProviderFixtureId: match.resultProviderFixtureId,
    resultUpdatedAt: match.resultUpdatedAt
  }));

  try {
    await database.insert(users).values([
      { id: leaderId, firstName: "Simulation", lastName: "Leader", email: leaderEmail },
      { id: chaserId, firstName: "Simulation", lastName: "Chaser", email: chaserEmail }
    ]);

    await database
      .update(matches)
      .set({
        status: "scheduled",
        homeScore: null,
        awayScore: null,
        actualOutcome: null,
        resultProvider: null,
        resultProviderFixtureId: null,
        resultUpdatedAt: null,
        updatedAt: sql`now()`
      })
      .where(
        inArray(
          matches.id,
          targetMatches.map((match) => match.id)
        )
      );

    await database.insert(predictions).values([
      { userId: leaderId, matchId: targetMatches[0].id, prediction: "home" },
      { userId: leaderId, matchId: targetMatches[1].id, prediction: "draw" },
      { userId: leaderId, matchId: targetMatches[2].id, prediction: "away" },
      { userId: chaserId, matchId: targetMatches[0].id, prediction: "away" },
      { userId: chaserId, matchId: targetMatches[1].id, prediction: "draw" }
    ]);

    const beforeResults = await getLeaderboard();
    const leaderBefore = beforeResults.find((row) => row.user.email === leaderEmail);
    const chaserBefore = beforeResults.find((row) => row.user.email === chaserEmail);

    assert(leaderBefore?.predicted === 3, "Leader should have 3 predictions before results.");
    assert(chaserBefore?.predicted === 2, "Chaser should have 2 predictions before results.");
    assert(leaderBefore?.scored === 0 && chaserBefore?.scored === 0, "Simulation users should have no scored picks before results.");

    await database
      .update(matches)
      .set({
        status: "final",
        homeScore: 2,
        awayScore: 1,
        actualOutcome: "home",
        resultProvider: "simulation",
        resultProviderFixtureId: `simulation-${targetMatches[0].id}`,
        resultUpdatedAt: new Date(),
        updatedAt: sql`now()`
      })
      .where(eq(matches.id, targetMatches[0].id));

    await database
      .update(matches)
      .set({
        status: "final",
        homeScore: 1,
        awayScore: 1,
        actualOutcome: "draw",
        resultProvider: "simulation",
        resultProviderFixtureId: `simulation-${targetMatches[1].id}`,
        resultUpdatedAt: new Date(),
        updatedAt: sql`now()`
      })
      .where(eq(matches.id, targetMatches[1].id));

    const afterResults = await getLeaderboard();
    const leaderAfter = afterResults.find((row) => row.user.email === leaderEmail);
    const chaserAfter = afterResults.find((row) => row.user.email === chaserEmail);

    assert(leaderAfter?.correct === 2 && leaderAfter.scored === 2 && leaderAfter.accuracy === 100, "Leader should be 2/2 after scores arrive.");
    assert(chaserAfter?.correct === 1 && chaserAfter.scored === 2 && chaserAfter.accuracy === 50, "Chaser should be 1/2 after scores arrive.");
    assert(
      afterResults.findIndex((row) => row.user.email === leaderEmail) < afterResults.findIndex((row) => row.user.email === chaserEmail),
      "Leader should rank above chaser after score recalculation."
    );

    console.log("Simulation passed:");
    console.log(`- Predictions saved for ${leaderEmail} and ${chaserEmail}`);
    console.log("- Scores arrived for two matches");
    console.log("- Leaderboard recalculated accuracy and order");
    console.log("- Cleanup will restore match state and remove simulation users before exit");
  } finally {
    await database.delete(predictions).where(inArray(predictions.userId, [leaderId, chaserId]));
    await database.delete(users).where(inArray(users.id, [leaderId, chaserId]));

    for (const snapshot of snapshots) {
      await database
        .update(matches)
        .set({
          status: snapshot.status,
          homeScore: snapshot.homeScore,
          awayScore: snapshot.awayScore,
          actualOutcome: snapshot.actualOutcome,
          resultProvider: snapshot.resultProvider,
          resultProviderFixtureId: snapshot.resultProviderFixtureId,
          resultUpdatedAt: snapshot.resultUpdatedAt,
          updatedAt: sql`now()`
        })
        .where(and(eq(matches.id, snapshot.id), inArray(matches.id, snapshots.map((match) => match.id))));
    }
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
