import type { Match, Team } from "@/db/schema";

export type SweepstakeAllocation = {
  owner: string;
  teamCode: string;
};

export type SweepstakePrize = {
  id: "winner" | "most-goals" | "best-defence" | "most-red-cards" | "most-own-goals";
  icon: string;
  label: string;
  share: number;
  dataSource: "results" | "api-events";
};

export type SweepstakeAwardLeader = {
  prizeId: SweepstakePrize["id"];
  status: "pending" | "live" | "needs-api-events";
  label: string;
  detail: string;
  owner: string | null;
};

export const sweepstakeAllocations = [
  { owner: "Jaymin Korant", teamCode: "RSA" },
  { owner: "Elliott Gruzin", teamCode: "POR" },
  { owner: "Sam Smith", teamCode: "IRN" },
  { owner: "Sandi Chanda", teamCode: "KSA" },
  { owner: "Cam Torrens", teamCode: "SCO" },
  { owner: "George Williamson", teamCode: "CIV" },
  { owner: "Ugo Okoroafor", teamCode: "IRQ" },
  { owner: "Kimberly Pena", teamCode: "ENG" },
  { owner: "Oliver Wood", teamCode: "BRA" },
  { owner: "Ronan Greene", teamCode: "COL" },
  { owner: "Ash Garner", teamCode: "EGY" },
  { owner: "Ash Garner", teamCode: "COD" },
  { owner: "Nina Nguyen", teamCode: "KOR" },
  { owner: "Romain Bourboulou", teamCode: "ALG" },
  { owner: "Alex Heald", teamCode: "ESP" },
  { owner: "George Montagu", teamCode: "MEX" },
  { owner: "Yazan Judeh", teamCode: "JPN" },
  { owner: "Douglas Adams", teamCode: "AUS" },
  { owner: "Douglas Adams", teamCode: "ECU" },
  { owner: "Alex Henriques", teamCode: "MAR" },
  { owner: "Alexis Dumon", teamCode: "BEL" },
  { owner: "Tobi Lipede", teamCode: "USA" },
  { owner: "Tom Jenkin", teamCode: "AUT" },
  { owner: "Tom Jenkin", teamCode: "PAN" },
  { owner: "Ed Jeffery", teamCode: "CAN" },
  { owner: "Tom Dyson", teamCode: "SWE" },
  { owner: "Nithish Kumar Akula", teamCode: "HAI" },
  { owner: "Josie Steer", teamCode: "CRO" },
  { owner: "Will Massey", teamCode: "NED" },
  { owner: "Baptiste Pinard", teamCode: "ARG" },
  { owner: "Chris Spencer", teamCode: "GHA" },
  { owner: "Ale Zacarias", teamCode: "SEN" },
  { owner: "Yuxi Huan", teamCode: "PAR" },
  { owner: "Nathan Griffiths", teamCode: "CPV" },
  { owner: "Jack Osborne", teamCode: "FRA" },
  { owner: "Chloe Kelleher", teamCode: "TUN" },
  { owner: "Vlad Crudu", teamCode: "BIH" },
  { owner: "Zac Hinton", teamCode: "GER" },
  { owner: "Arjun Gill", teamCode: "JOR" },
  { owner: "Peter Birley", teamCode: "TUR" },
  { owner: "Mike Butler", teamCode: "UZB" },
  { owner: "Henna Patel", teamCode: "CZE" },
  { owner: "Olivia Reed", teamCode: "CUW" },
  { owner: "Dave Pit", teamCode: "NZL" }
] satisfies SweepstakeAllocation[];

export const sweepstakePrizes = [
  {
    id: "winner",
    icon: "Trophy",
    label: "Winning team",
    share: 60,
    dataSource: "results"
  },
  {
    id: "most-goals",
    icon: "Goal",
    label: "Most goals scored",
    share: 10,
    dataSource: "results"
  },
  {
    id: "best-defence",
    icon: "Shield",
    label: "Best defence",
    share: 10,
    dataSource: "results"
  },
  {
    id: "most-red-cards",
    icon: "Square",
    label: "Most red cards",
    share: 10,
    dataSource: "api-events"
  },
  {
    id: "most-own-goals",
    icon: "BadgeX",
    label: "Most own goals",
    share: 10,
    dataSource: "api-events"
  }
] satisfies SweepstakePrize[];

export function getSweepstakeOwner(teamCode: string | null | undefined) {
  if (!teamCode) return null;
  return sweepstakeAllocations.find((allocation) => allocation.teamCode === teamCode)?.owner ?? null;
}

export function sweepstakeAllocationsByOwner(teamsByCode: Map<string, Team>) {
  const owners = new Map<string, Array<Team | { code: string; name: string }>>();

  for (const allocation of sweepstakeAllocations) {
    const teams = owners.get(allocation.owner) ?? [];
    teams.push(teamsByCode.get(allocation.teamCode) ?? { code: allocation.teamCode, name: allocation.teamCode });
    owners.set(allocation.owner, teams);
  }

  return Array.from(owners.entries()).map(([owner, allocatedTeams]) => ({
    owner,
    teams: allocatedTeams.sort((a, b) => a.name.localeCompare(b.name))
  }));
}

export function getUnallocatedSweepstakeTeams(teams: Team[]) {
  const allocatedCodes = new Set(sweepstakeAllocations.map((allocation) => allocation.teamCode));
  return teams.filter((team) => !allocatedCodes.has(team.code)).sort((a, b) => a.name.localeCompare(b.name));
}

export function calculateSweepstakeAwardLeaders({
  matches,
  teams
}: {
  matches: Match[];
  teams: Team[];
}): SweepstakeAwardLeader[] {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const stats = new Map<string, { scored: number; conceded: number; played: number }>();

  for (const match of matches) {
    if (match.status !== "final" || match.homeScore === null || match.awayScore === null) continue;
    if (!match.homeTeamId || !match.awayTeamId) continue;

    const home = stats.get(match.homeTeamId) ?? { scored: 0, conceded: 0, played: 0 };
    const away = stats.get(match.awayTeamId) ?? { scored: 0, conceded: 0, played: 0 };

    home.scored += match.homeScore;
    home.conceded += match.awayScore;
    home.played += 1;
    away.scored += match.awayScore;
    away.conceded += match.homeScore;
    away.played += 1;

    stats.set(match.homeTeamId, home);
    stats.set(match.awayTeamId, away);
  }

  const winner = findTournamentWinner(matches, teamById);
  const mostGoals = topTeams(stats, teamById, (stat) => stat.scored, "desc");
  const bestDefence = topTeams(stats, teamById, (stat) => stat.conceded, "asc");

  return [
    teamAward("winner", winner ? [winner] : [], winner ? "Tournament winner recorded" : "Pending final result"),
    teamAward("most-goals", mostGoals, mostGoals.length ? "From synced final scores" : "Pending final scores"),
    teamAward("best-defence", bestDefence, bestDefence.length ? "From synced final scores" : "Pending final scores"),
    {
      prizeId: "most-red-cards",
      status: "needs-api-events",
      label: "Needs event feed",
      detail: "Can come from API-Football fixture events/cards once we store team card totals.",
      owner: null
    },
    {
      prizeId: "most-own-goals",
      status: "needs-api-events",
      label: "Needs event feed",
      detail: "Can come from API-Football fixture events once own-goal events are persisted.",
      owner: null
    }
  ];
}

function findTournamentWinner(matches: Match[], teamById: Map<string, Team>) {
  const final = matches.find((match) => match.roundId === "final" && match.status === "final" && match.winningTeamId);
  return final?.winningTeamId ? teamById.get(final.winningTeamId) ?? null : null;
}

function topTeams(
  stats: Map<string, { scored: number; conceded: number; played: number }>,
  teamById: Map<string, Team>,
  valueFor: (stat: { scored: number; conceded: number; played: number }) => number,
  direction: "asc" | "desc"
) {
  const entries = Array.from(stats.entries()).filter(([, stat]) => stat.played > 0);
  if (!entries.length) return [];

  const values = entries.map(([, stat]) => valueFor(stat));
  const target = direction === "asc" ? Math.min(...values) : Math.max(...values);

  return entries
    .filter(([, stat]) => valueFor(stat) === target)
    .map(([teamId, stat]) => ({ team: teamById.get(teamId), value: valueFor(stat) }))
    .filter((entry): entry is { team: Team; value: number } => Boolean(entry.team))
    .sort((a, b) => a.team.name.localeCompare(b.team.name));
}

function teamAward(
  prizeId: SweepstakePrize["id"],
  leaders: Array<Team | { team: Team; value: number }>,
  pendingDetail: string
): SweepstakeAwardLeader {
  if (!leaders.length) {
    return {
      prizeId,
      status: "pending",
      label: "Pending",
      detail: pendingDetail,
      owner: null
    };
  }

  const labels = leaders.map((leader) => {
    const team = "team" in leader ? leader.team : leader;
    const value = "value" in leader ? ` (${leader.value})` : "";
    return `${team.name}${value}`;
  });
  const owners = leaders
    .map((leader) => getSweepstakeOwner(("team" in leader ? leader.team : leader).code))
    .filter((owner): owner is string => Boolean(owner));

  return {
    prizeId,
    status: "live",
    label: labels.join(", "),
    detail: pendingDetail,
    owner: owners.length ? owners.join(", ") : null
  };
}
