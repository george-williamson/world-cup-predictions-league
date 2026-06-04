import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { matches, predictions, rounds, teams, users, type Match, type Prediction, type Round, type Team } from "@/db/schema";
import { calculateLeagueScore, isGroupStageComplete, rankLeaderboard, scorePrediction, type LeaderboardRow, type MatchWithTeams } from "@/lib/domain";
import { seedMatches, seedRounds, seedTeams } from "@/lib/seed-data";
import { getCurrentUserId } from "@/lib/session";

const awayTeams = alias(teams, "away_team");

type MatchRow = {
  match: Match;
  round: Round;
  homeTeam: Team | null;
  awayTeam: Team | null;
  prediction: Prediction | null;
};

function mapMatch(row: MatchRow): MatchWithTeams {
  return {
    ...row.match,
    round: row.round,
    homeTeam: row.homeTeam,
    awayTeam: row.awayTeam,
    userPrediction: row.prediction
  };
}

export async function getBootstrapData() {
  const database = getDb();
  const userId = await getCurrentUserId();

  const [currentUser] = userId ? await database.select().from(users).where(eq(users.id, userId)).limit(1) : [];

  const roundRows = await database.select().from(rounds).orderBy(asc(rounds.sequence));
  const matchRows = await database
    .select({
      match: matches,
      round: rounds,
      homeTeam: teams,
      awayTeam: awayTeams,
      prediction: predictions
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .leftJoin(teams, eq(matches.homeTeamId, teams.id))
    .leftJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .leftJoin(predictions, and(eq(predictions.matchId, matches.id), userId ? eq(predictions.userId, userId) : sql`false`))
    .orderBy(asc(rounds.sequence), asc(matches.kickoffAt), asc(matches.matchNumber));

  const leaderboard = await getLeaderboard();
  const matchCounts = await database.select({ roundId: matches.roundId, total: count() }).from(matches).groupBy(matches.roundId);
  const userCounts = userId
    ? await database
        .select({ roundId: matches.roundId, total: count() })
        .from(predictions)
        .innerJoin(matches, eq(predictions.matchId, matches.id))
        .where(eq(predictions.userId, userId))
        .groupBy(matches.roundId)
    : [];

  const mappedMatches = matchRows.map((row) => mapMatch(row as MatchRow));

  return {
    currentUser: currentUser ?? null,
    rounds: roundRows,
    matches: mappedMatches,
    groupStageComplete: isGroupStageComplete(mappedMatches),
    leaderboard,
    completion: roundRows.map((round) => ({
      roundId: round.id,
      total: matchCounts.find((item) => item.roundId === round.id)?.total ?? 0,
      predicted: userCounts.find((item) => item.roundId === round.id)?.total ?? 0
    }))
  };
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const database = getDb();
  const allUsers = await database.select().from(users).orderBy(asc(users.createdAt));
  const allRounds = await database.select().from(rounds);
  const allMatches = await database.select().from(matches);
  const allPredictions = await database.select().from(predictions).orderBy(asc(predictions.updatedAt));

  const matchById = new Map(allMatches.map((match) => [match.id, match]));
  const roundById = new Map(allRounds.map((round) => [round.id, round]));

  const rawRows = allUsers.map((user) => {
      const userPredictions = allPredictions.filter((prediction) => prediction.userId === user.id);
      const scoredPredictions = userPredictions
        .map((prediction) => ({ prediction, match: matchById.get(prediction.matchId) }))
        .filter((item): item is { prediction: Prediction; match: Match } => Boolean(item.match && item.match.status === "final" && item.match.actualOutcome));

      const correct = scoredPredictions.filter((item) => scorePrediction(item.prediction, item.match)).length;
      const roundAccuracy = allRounds.map((round) => {
        const scored = scoredPredictions.filter((item) => item.match.roundId === round.id);
        const roundCorrect = scored.filter((item) => scorePrediction(item.prediction, item.match)).length;

        return {
          roundId: round.id,
          roundName: round.name,
          correct: roundCorrect,
          scored: scored.length,
          accuracy: scored.length === 0 ? 0 : Math.round((roundCorrect / scored.length) * 100)
        };
      });

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        predicted: userPredictions.length,
        scored: scoredPredictions.length,
        correct,
        accuracy: scoredPredictions.length === 0 ? 0 : Math.round((correct / scoredPredictions.length) * 100),
        leagueScore: 0,
        participation: 0,
        lastPredictionAt: userPredictions.at(-1)?.updatedAt ?? null,
        roundAccuracy: roundAccuracy.filter((round) => roundById.has(round.roundId))
      };
    });
  const maxPredicted = Math.max(0, ...rawRows.map((row) => row.predicted));

  return rankLeaderboard(
    rawRows.map((row) => ({
      ...row,
      ...calculateLeagueScore({
        accuracy: row.accuracy,
        predicted: row.predicted,
        scored: row.scored,
        maxPredicted
      })
    }))
  );
}

export async function getLeagueMeta() {
  const database = getDb();
  const [participantCount] = await database.select({ total: count() }).from(users);

  return {
    participantCount: participantCount?.total ?? 0
  };
}

export async function seedDatabase() {
  const database = getDb();

  await database
    .insert(rounds)
    .values(seedRounds.map((round) => ({ ...round, deadline: new Date(round.deadline) })))
    .onConflictDoUpdate({
      target: rounds.id,
      set: {
        name: sql`excluded.name`,
        sequence: sql`excluded.sequence`,
        type: sql`excluded.type`,
        deadline: sql`excluded.deadline`
      }
    });

  await database.insert(teams).values(seedTeams).onConflictDoUpdate({
    target: teams.code,
    set: {
      name: sql`excluded.name`,
      group: sql`excluded.group_name`,
      flagUrl: sql`excluded.flag_url`
    }
  });

  const teamRows = await database.select().from(teams).where(
    inArray(
      teams.code,
      seedTeams.map((team) => team.code)
    )
  );
  const teamByCode = new Map(teamRows.map((team) => [team.code, team]));

  await database.insert(matches).values(
    seedMatches.map((match) => ({
      id: match.id,
      roundId: match.roundId,
      matchNumber: match.matchNumber,
      type: match.type,
      group: match.group,
      homeTeamId: match.homeCode ? teamByCode.get(match.homeCode)?.id : null,
      awayTeamId: match.awayCode ? teamByCode.get(match.awayCode)?.id : null,
      homeSlot: match.homeSlot,
      awaySlot: match.awaySlot,
      kickoffAt: new Date(match.kickoffAt),
      venue: match.venue
    }))
  ).onConflictDoUpdate({
    target: matches.id,
    set: {
      roundId: sql`excluded.round_id`,
      matchNumber: sql`excluded.match_number`,
      type: sql`excluded.type`,
      group: sql`excluded.group_name`,
      homeTeamId: sql`excluded.home_team_id`,
      awayTeamId: sql`excluded.away_team_id`,
      homeSlot: sql`excluded.home_slot`,
      awaySlot: sql`excluded.away_slot`,
      kickoffAt: sql`excluded.kickoff_at`,
      venue: sql`excluded.venue`,
      updatedAt: new Date()
    }
  });

  return {
    teams: seedTeams.length,
    rounds: seedRounds.length,
    matches: seedMatches.length
  };
}
