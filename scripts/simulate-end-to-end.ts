import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { matches, predictions, rounds, users, type Match } from "@/db/schema";
import { isGroupStageComplete, isPredictionAllowed } from "@/lib/domain";
import { loadLocalEnv } from "@/lib/load-env";
import { getLeaderboard } from "@/lib/queries";

loadLocalEnv();

type SnapshotMatch = Pick<
  Match,
  | "id"
  | "status"
  | "homeScore"
  | "awayScore"
  | "actualOutcome"
  | "winningTeamId"
  | "resultProvider"
  | "resultProviderFixtureId"
  | "resultUpdatedAt"
>;

async function main() {
  const database = getDb();
  const simulationId = randomUUID().slice(0, 8);
  const leaderEmail = `simulation.leader.${simulationId}@tomoro.ai`;
  const chaserEmail = `simulation.chaser.${simulationId}@tomoro.ai`;
  const leaderId = randomUUID();
  const chaserId = randomUUID();

  const roundRows = await database.select().from(rounds).orderBy(asc(rounds.sequence));
  const groupRounds = roundRows.filter((round) => round.type === "group");
  const firstKnockoutRound = roundRows.find((round) => round.type === "knockout");
  if (!firstKnockoutRound) throw new Error("Need at least one knockout round.");

  const groupMatches = await database.select().from(matches).where(eq(matches.type, "group")).orderBy(asc(matches.kickoffAt), asc(matches.matchNumber));
  const knockoutMatches = await database
    .select()
    .from(matches)
    .where(eq(matches.roundId, firstKnockoutRound.id))
    .orderBy(asc(matches.kickoffAt), asc(matches.matchNumber))
    .limit(1);

  const firstGroupMatches = groupMatches.slice(0, 3);
  const [firstKnockout] = knockoutMatches;
  if (firstGroupMatches.length < 3 || !firstKnockout) {
    throw new Error("Need at least three group matches and one knockout match to run the simulation.");
  }

  const touchedMatches = [...groupMatches, firstKnockout];
  const snapshots: SnapshotMatch[] = touchedMatches.map((match) => ({
    id: match.id,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    actualOutcome: match.actualOutcome,
    winningTeamId: match.winningTeamId,
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
        winningTeamId: null,
        resultProvider: null,
        resultProviderFixtureId: null,
        resultUpdatedAt: null,
        updatedAt: sql`now()`
      })
      .where(inArray(matches.id, touchedMatches.map((match) => match.id)));

    const resetGroupMatches = await database.select().from(matches).where(eq(matches.type, "group"));
    assert(!isGroupStageComplete(resetGroupMatches), "Group stage should start incomplete in the simulation.");
    assert(
      !isPredictionAllowed({ ...firstKnockout, round: firstKnockoutRound }, new Date("2026-06-12T12:00:00.000Z"), { groupStageComplete: false }),
      "Knockout predictions should be locked before the group stage is complete."
    );

    await database.insert(predictions).values([
      { userId: leaderId, matchId: firstGroupMatches[0].id, prediction: "home" },
      { userId: leaderId, matchId: firstGroupMatches[1].id, prediction: "draw" },
      { userId: leaderId, matchId: firstGroupMatches[2].id, prediction: "away" },
      { userId: chaserId, matchId: firstGroupMatches[0].id, prediction: "away" },
      { userId: chaserId, matchId: firstGroupMatches[1].id, prediction: "draw" }
    ]);

    const beforeResults = await getLeaderboard();
    const leaderBefore = rowFor(beforeResults, leaderEmail);
    const chaserBefore = rowFor(beforeResults, chaserEmail);

    assert(leaderBefore.predicted === 3, "Leader should have 3 predictions before results.");
    assert(chaserBefore.predicted === 2, "Chaser should have 2 predictions before results.");
    assert(leaderBefore.scored === 0 && chaserBefore.scored === 0, "Simulation users should have no scored picks before results.");

    await finaliseMatch(firstGroupMatches[0], 2, 1, "home");
    await finaliseMatch(firstGroupMatches[1], 1, 1, "draw");

    const afterPartialGroupResults = await getLeaderboard();
    const leaderAfterPartial = rowFor(afterPartialGroupResults, leaderEmail);
    const chaserAfterPartial = rowFor(afterPartialGroupResults, chaserEmail);

    assert(leaderAfterPartial.correct === 2 && leaderAfterPartial.scored === 2, "Leader should be 2/2 after the first two group results.");
    assert(chaserAfterPartial.correct === 1 && chaserAfterPartial.scored === 2, "Chaser should be 1/2 after the first two group results.");
    assert(
      afterPartialGroupResults.findIndex((row) => row.user.email === leaderEmail) < afterPartialGroupResults.findIndex((row) => row.user.email === chaserEmail),
      "Leader should rank above chaser after score recalculation."
    );

    for (const match of groupMatches.filter((match) => !firstGroupMatches.slice(0, 2).some((scored) => scored.id === match.id))) {
      await finaliseMatch(match, 1, 1, "draw");
    }

    const finalGroupMatches = await database.select().from(matches).where(eq(matches.type, "group"));
    assert(isGroupStageComplete(finalGroupMatches), "Group stage should be complete after all simulated group results.");
    assert(
      isPredictionAllowed({ ...firstKnockout, round: firstKnockoutRound }, new Date("2026-06-26T12:00:00.000Z"), { groupStageComplete: true }),
      "Knockout predictions should open once the group stage is complete."
    );

    await database.insert(predictions).values([
      { userId: leaderId, matchId: firstKnockout.id, prediction: "home" },
      { userId: chaserId, matchId: firstKnockout.id, prediction: "away" }
    ]);

    await finaliseMatch(firstKnockout, 3, 2, "home");

    const afterKnockout = await getLeaderboard();
    const leaderAfterKnockout = rowFor(afterKnockout, leaderEmail);
    const chaserAfterKnockout = rowFor(afterKnockout, chaserEmail);

    assert(leaderAfterKnockout.correct === 3, "Leader should have group plus knockout correct picks.");
    assert(chaserAfterKnockout.correct === 1, "Chaser should miss the simulated knockout result.");
    assert(
      leaderAfterKnockout.roundAccuracy.some((round) => round.roundId === firstKnockoutRound.id && round.correct === 1 && round.scored === 1),
      "Knockout round accuracy should be represented on the personal timeline."
    );

    console.log("Simulation passed:");
    console.log(`- Predictions saved for ${leaderEmail} and ${chaserEmail}`);
    console.log("- Group-stage results updated leaderboard accuracy and order");
    console.log("- Knockout predictions stayed locked until group-stage completion");
    console.log("- Knockout result updated leaderboard and round history");
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
          winningTeamId: snapshot.winningTeamId,
          resultProvider: snapshot.resultProvider,
          resultProviderFixtureId: snapshot.resultProviderFixtureId,
          resultUpdatedAt: snapshot.resultUpdatedAt,
          updatedAt: sql`now()`
        })
        .where(and(eq(matches.id, snapshot.id), inArray(matches.id, snapshots.map((match) => match.id))));
    }
  }

  async function finaliseMatch(match: Match, homeScore: number, awayScore: number, actualOutcome: "home" | "draw" | "away") {
    await database
      .update(matches)
      .set({
        status: "final",
        homeScore,
        awayScore,
        actualOutcome,
        resultProvider: "simulation",
        resultProviderFixtureId: `simulation-${match.id}`,
        resultUpdatedAt: new Date(),
        updatedAt: sql`now()`
      })
      .where(eq(matches.id, match.id));
  }
}

function rowFor(rows: Awaited<ReturnType<typeof getLeaderboard>>, email: string) {
  const row = rows.find((item) => item.user.email === email);
  assert(row, `Expected leaderboard row for ${email}.`);
  return row;
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
