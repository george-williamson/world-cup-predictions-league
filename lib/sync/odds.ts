import { and, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/db";
import { matches, oddsSnapshots, teams, type Match, type Team } from "@/db/schema";

const baseUrl = "https://api.the-odds-api.com/v4";

type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

type OddsOutcome = {
  name: string;
  price: number;
};

type OddsMarket = {
  key: string;
  outcomes: OddsOutcome[];
};

type OddsBookmaker = {
  key: string;
  title: string;
  last_update?: string;
  markets: OddsMarket[];
};

type OddsEvent = {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
};

type EventMatch = {
  event: OddsEvent;
  strategy: "date+teams" | "teams";
};

export type OddsSyncSummary = {
  sportKey: string;
  regions: string;
  markets: string;
  fetched: number;
  fixtureCount: number;
  matched: number;
  dateMatched: number;
  pairMatched: number;
  updated: number;
  unmatched: Array<{ matchId: string; kickoffDate: string; home: string; away: string }>;
};

export async function syncOdds() {
  const apiKey = process.env.ODDS_API_KEY ?? process.env.ODDS_API_IO_KEY;
  if (!apiKey) {
    throw new Error("ODDS_API_KEY or ODDS_API_IO_KEY is required.");
  }

  const regions = process.env.ODDS_API_REGIONS ?? "uk";
  const markets = process.env.ODDS_API_MARKETS ?? "h2h";
  const sportKey = process.env.ODDS_API_SPORT_KEY ?? "upcoming";
  const database = getDb();
  const homeTeams = alias(teams, "home_team");
  const awayTeams = alias(teams, "away_team");
  const fixtures = (await database
    .select({
      match: matches,
      homeTeam: homeTeams,
      awayTeam: awayTeams
    })
    .from(matches)
    .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .where(and(eq(matches.type, "group"), isNotNull(matches.homeTeamId), isNotNull(matches.awayTeamId)))) as Array<{
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
  }>;

  const events = await fetchJson<OddsEvent[]>(
    `/sports/${encodeURIComponent(sportKey)}/odds/?regions=${encodeURIComponent(regions)}&markets=${encodeURIComponent(markets)}`,
    apiKey
  );

  let matched = 0;
  let dateMatched = 0;
  let pairMatched = 0;
  let updated = 0;
  const unmatched: OddsSyncSummary["unmatched"] = [];

  for (const fixture of fixtures) {
    const match = { ...fixture.match, homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam };
    const eventMatch = findEvent(events, match);
    if (!eventMatch) {
      unmatched.push(unmatchedMatch(match));
      continue;
    }

    matched += 1;
    if (eventMatch.strategy === "date+teams") dateMatched += 1;
    if (eventMatch.strategy === "teams") pairMatched += 1;

    const implied = impliedProbabilities(eventMatch.event, match);
    if (!implied) continue;

    await database
      .update(matches)
      .set({
        oddsApiEventId: eventMatch.event.id,
        homeWinProbability: implied.home,
        drawProbability: implied.draw,
        awayWinProbability: implied.away,
        oddsUpdatedAt: implied.updatedAt
      })
      .where(eq(matches.id, match.id));

    await database.insert(oddsSnapshots).values({
      matchId: match.id,
      provider: "the-odds-api",
      providerEventId: eventMatch.event.id,
      bookmaker: `aggregate:${regions}`,
      market: "h2h",
      homeOdds: implied.averageOdds.home,
      drawOdds: implied.averageOdds.draw,
      awayOdds: implied.averageOdds.away,
      homeWinProbability: implied.home,
      drawProbability: implied.draw,
      awayWinProbability: implied.away,
      marketUpdatedAt: implied.updatedAt
    });

    updated += 1;
  }

  return {
    sportKey,
    regions,
    markets,
    fetched: events.length,
    fixtureCount: fixtures.length,
    matched,
    dateMatched,
    pairMatched,
    updated,
    unmatched: unmatched.slice(0, 12)
  } satisfies OddsSyncSummary;
}

async function fetchJson<T>(path: string, apiKey: string): Promise<T> {
  const joiner = path.includes("?") ? "&" : "?";
  const response = await fetch(`${baseUrl}${path}${joiner}apiKey=${apiKey}`);

  if (!response.ok) {
    throw new Error(`The Odds API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function findEvent(events: OddsEvent[], match: MatchWithTeams): EventMatch | null {
  const kickoffDay = match.kickoffAt.toISOString().slice(0, 10);
  const home = normaliseName(match.homeTeam.name);
  const away = normaliseName(match.awayTeam.name);

  const sameDay = events.find((event) => {
    if (!event.commence_time.startsWith(kickoffDay)) return false;

    const eventHome = normaliseName(event.home_team);
    const eventAway = normaliseName(event.away_team);
    return (eventHome === home && eventAway === away) || (eventHome === away && eventAway === home);
  });

  if (sameDay) return { event: sameDay, strategy: "date+teams" };

  const samePair = events.filter((event) => {
    const eventHome = normaliseName(event.home_team);
    const eventAway = normaliseName(event.away_team);
    return (eventHome === home && eventAway === away) || (eventHome === away && eventAway === home);
  });

  if (samePair.length === 1) return { event: samePair[0], strategy: "teams" };
  return null;
}

function impliedProbabilities(event: OddsEvent, match: MatchWithTeams) {
  const homeName = normaliseName(match.homeTeam.name);
  const awayName = normaliseName(match.awayTeam.name);
  const moneylines: Array<{ home: number; draw?: number; away: number; updatedAt?: string }> = [];

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find((item) => item.key === "h2h");
    if (!market) continue;

    const home = market.outcomes.find((outcome) => normaliseName(outcome.name) === homeName)?.price;
    const draw = market.outcomes.find((outcome) => normaliseName(outcome.name) === "draw")?.price;
    const away = market.outcomes.find((outcome) => normaliseName(outcome.name) === awayName)?.price;

    if (home && away) moneylines.push({ home, draw, away, updatedAt: bookmaker.last_update });
  }

  if (moneylines.length === 0) return null;

  const average = moneylines.reduce<{ home: number; draw: number; away: number }>(
    (sum, market) => ({
      home: sum.home + market.home,
      draw: sum.draw + (market.draw ?? 0),
      away: sum.away + market.away
    }),
    { home: 0, draw: 0, away: 0 }
  );

  const homeDecimal = average.home / moneylines.length;
  const drawDecimal = average.draw > 0 ? average.draw / moneylines.length : 0;
  const awayDecimal = average.away / moneylines.length;
  const raw = {
    home: 1 / homeDecimal,
    draw: drawDecimal > 0 ? 1 / drawDecimal : 0,
    away: 1 / awayDecimal
  };
  const total = raw.home + raw.draw + raw.away;

  return {
    home: Math.round((raw.home / total) * 100),
    draw: Math.round((raw.draw / total) * 100),
    away: Math.round((raw.away / total) * 100),
    averageOdds: {
      home: homeDecimal.toFixed(3),
      draw: drawDecimal > 0 ? drawDecimal.toFixed(3) : null,
      away: awayDecimal.toFixed(3)
    },
    updatedAt: mostRecentUpdate(moneylines)
  };
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

function mostRecentUpdate(markets: Array<{ updatedAt?: string }>) {
  const latest = markets
    .map((market) => (market.updatedAt ? new Date(market.updatedAt).getTime() : 0))
    .reduce((max, value) => Math.max(max, value), 0);

  return latest > 0 ? new Date(latest) : new Date();
}

function unmatchedMatch(match: MatchWithTeams) {
  return {
    matchId: match.id,
    kickoffDate: match.kickoffAt.toISOString().slice(0, 10),
    home: match.homeTeam.name,
    away: match.awayTeam.name
  };
}
