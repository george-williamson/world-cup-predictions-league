import { and, eq, gte, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/db";
import { matches, teams, type Match, type Team } from "@/db/schema";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

const apiKey = process.env.API_FOOTBALL_KEY ?? process.env.APISPORTS_KEY;
const leagueId = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
const season = process.env.API_FOOTBALL_SEASON ?? "2026";
const finishedStatuses = process.env.API_FOOTBALL_FINISHED_STATUSES ?? "FT-AET-PEN";
const baseUrl = "https://v3.football.api-sports.io";

type MatchWithTeams = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
    };
  };
  teams: {
    home: { name: string; winner: boolean | null };
    away: { name: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
};

type ApiResponse = {
  response: ApiFixture[];
};

type FixtureMatch = {
  fixture: ApiFixture;
  strategy: "provider-id" | "date+teams" | "teams";
};

const dateArg = process.argv.find((arg) => arg.startsWith("--date="))?.split("=")[1] ?? process.argv[2] ?? todayIsoDate();

async function main() {
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY or APISPORTS_KEY is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    throw new Error("Usage: pnpm results:sync --date YYYY-MM-DD");
  }

  const database = getDb();
  const homeTeams = alias(teams, "home_team");
  const awayTeams = alias(teams, "away_team");
  const dayStart = new Date(`${dateArg}T00:00:00.000Z`);
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const seededFixtures = (await database
    .select({
      match: matches,
      homeTeam: homeTeams,
      awayTeam: awayTeams
    })
    .from(matches)
    .leftJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .leftJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .where(and(gte(matches.kickoffAt, dayStart), lt(matches.kickoffAt, nextDay)))) as Array<{
    match: Match;
    homeTeam: Team | null;
    awayTeam: Team | null;
  }>;

  const fixtures = await fetchFixtures(dateArg);
  let matched = 0;
  let updated = 0;
  const unmatched: MatchWithTeams[] = [];

  for (const seeded of seededFixtures) {
    const match = { ...seeded.match, homeTeam: seeded.homeTeam, awayTeam: seeded.awayTeam };
    const fixtureMatch = findFixture(fixtures, match);
    if (!fixtureMatch) {
      unmatched.push(match);
      continue;
    }

    matched += 1;

    const result = parseResult(fixtureMatch.fixture, match);
    if (!result) {
      unmatched.push(match);
      continue;
    }

    await database
      .update(matches)
      .set({
        status: "final",
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        actualOutcome: result.actualOutcome,
        resultProvider: "api-football",
        resultProviderFixtureId: String(fixtureMatch.fixture.fixture.id),
        resultUpdatedAt: new Date(),
        updatedAt: sql`now()`
      })
      .where(eq(matches.id, match.id));

    updated += 1;
  }

  console.log(
    `Fetched ${fixtures.length} finished API-Football fixtures for ${dateArg}. Matched ${matched}/${seededFixtures.length} seeded fixtures and updated ${updated}.`
  );

  if (unmatched.length > 0) {
    console.log("Unmatched seeded fixtures:");
    for (const match of unmatched.slice(0, 8)) {
      console.log(`- ${match.id}: ${displayTeam(match.homeTeam, match.homeSlot)} vs ${displayTeam(match.awayTeam, match.awaySlot)}`);
    }
  }
}

async function fetchFixtures(date: string) {
  const url = new URL("/fixtures", baseUrl);
  url.searchParams.set("league", leagueId);
  url.searchParams.set("season", season);
  url.searchParams.set("date", date);
  url.searchParams.set("status", finishedStatuses);

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey ?? ""
    }
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiResponse;
  return payload.response ?? [];
}

function findFixture(fixtures: ApiFixture[], match: MatchWithTeams): FixtureMatch | null {
  const providerIdMatch = fixtures.find((fixture) => String(fixture.fixture.id) === match.resultProviderFixtureId);
  if (providerIdMatch) return { fixture: providerIdMatch, strategy: "provider-id" };

  const home = normaliseName(displayTeam(match.homeTeam, match.homeSlot));
  const away = normaliseName(displayTeam(match.awayTeam, match.awaySlot));
  const kickoffDay = match.kickoffAt.toISOString().slice(0, 10);

  const sameDay = fixtures.find((fixture) => {
    if (!fixture.fixture.date.startsWith(kickoffDay)) return false;
    return isSamePair(fixture, home, away);
  });

  if (sameDay) return { fixture: sameDay, strategy: "date+teams" };

  const samePair = fixtures.filter((fixture) => isSamePair(fixture, home, away));
  if (samePair.length === 1) return { fixture: samePair[0], strategy: "teams" };

  return null;
}

function parseResult(fixture: ApiFixture, match: MatchWithTeams) {
  if (fixture.goals.home === null || fixture.goals.away === null) {
    return null;
  }

  const eventHome = normaliseName(fixture.teams.home.name);
  const seededHome = normaliseName(displayTeam(match.homeTeam, match.homeSlot));
  const apiHomeIsSeededHome = eventHome === seededHome;
  const homeScore = apiHomeIsSeededHome ? fixture.goals.home : fixture.goals.away;
  const awayScore = apiHomeIsSeededHome ? fixture.goals.away : fixture.goals.home;

  if (fixture.fixture.status.short === "PEN") {
    const homePens = apiHomeIsSeededHome ? fixture.score?.penalty?.home : fixture.score?.penalty?.away;
    const awayPens = apiHomeIsSeededHome ? fixture.score?.penalty?.away : fixture.score?.penalty?.home;
    if (typeof homePens === "number" && typeof awayPens === "number" && homePens !== awayPens) {
      return {
        homeScore,
        awayScore,
        actualOutcome: homePens > awayPens ? "home" : "away"
      } as const;
    }
  }

  return {
    homeScore,
    awayScore,
    actualOutcome: homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw"
  } as const;
}

function isSamePair(fixture: ApiFixture, home: string, away: string) {
  const eventHome = normaliseName(fixture.teams.home.name);
  const eventAway = normaliseName(fixture.teams.away.name);
  return (eventHome === home && eventAway === away) || (eventHome === away && eventAway === home);
}

function displayTeam(team: Team | null, slot: string) {
  return team?.name ?? slot;
}

function normaliseName(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(fc|cf|sc|the|republic)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const aliases: Record<string, string> = {
    "bosnia herzegovina": "bosnia and herzegovina",
    bosnia: "bosnia and herzegovina",
    "cote d ivoire": "ivory coast",
    czech: "czechia",
    "czech republic": "czechia",
    "korea south": "south korea",
    korea: "south korea",
    turkiye: "turkey",
    usa: "united states",
    us: "united states",
    "united states america": "united states"
  };

  return aliases[base] ?? base;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
