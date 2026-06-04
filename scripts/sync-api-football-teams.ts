import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { teams } from "@/db/schema";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

const apiKey = process.env.API_FOOTBALL_KEY ?? process.env.APISPORTS_KEY;
const leagueId = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
const season = process.env.API_FOOTBALL_SEASON ?? "2026";
const baseUrl = "https://v3.football.api-sports.io";

type ApiTeamResponse = {
  response: Array<{
    team: {
      id: number;
      name: string;
      code: string | null;
      country: string;
    };
  }>;
  errors?: unknown;
};

async function main() {
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY or APISPORTS_KEY is required.");
  }

  const database = getDb();
  const seededTeams = await database.select().from(teams);
  const providerTeams = await fetchTeams();

  let matched = 0;
  const unmatched = [];

  for (const seeded of seededTeams) {
    const providerTeam = findProviderTeam(providerTeams, seeded.name, seeded.code);
    if (!providerTeam) {
      unmatched.push(`${seeded.code} ${seeded.name}`);
      continue;
    }

    await database
      .update(teams)
      .set({
        apiFootballTeamId: providerTeam.team.id,
        apiFootballName: providerTeam.team.name,
        apiFootballUpdatedAt: sql`now()`
      })
      .where(eq(teams.id, seeded.id));

    matched += 1;
  }

  console.log(`Fetched ${providerTeams.length} API-Football teams for league ${leagueId}, season ${season}. Matched ${matched}/${seededTeams.length}.`);
  if (unmatched.length > 0) {
    console.log("Unmatched seeded teams:");
    for (const item of unmatched.slice(0, 12)) console.log(`- ${item}`);
  }
}

async function fetchTeams() {
  const url = new URL("/teams", baseUrl);
  url.searchParams.set("league", leagueId);
  url.searchParams.set("season", season);

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey ?? ""
    }
  });

  if (!response.ok) {
    throw new Error(`API-Football teams request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiTeamResponse;
  if (payload.errors && Object.keys(payload.errors).length > 0) {
    throw new Error(`API-Football teams request returned errors: ${JSON.stringify(payload.errors)}`);
  }

  return payload.response ?? [];
}

function findProviderTeam(providerTeams: ApiTeamResponse["response"], name: string, code: string) {
  const normalisedName = normaliseName(name);
  const normalisedCode = code.toLowerCase();

  return (
    providerTeams.find((item) => item.team.code?.toLowerCase() === normalisedCode) ??
    providerTeams.find((item) => normaliseName(item.team.name) === normalisedName) ??
    providerTeams.find((item) => normaliseName(item.team.country) === normalisedName)
  );
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
