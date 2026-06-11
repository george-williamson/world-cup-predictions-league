import { describe, expect, it } from "vitest";

import { seedMatches, seedRounds, seedTeams } from "@/lib/seed-data";

describe("seed data", () => {
  it("contains the full tournament shape", () => {
    expect(seedTeams).toHaveLength(48);
    expect(seedMatches).toHaveLength(104);
    expect(seedRounds.map((round) => round.id)).toEqual([
      "group-1",
      "group-2",
      "group-3",
      "round-of-32",
      "round-of-16",
      "quarter-finals",
      "semi-finals",
      "third-place",
      "final"
    ]);
  });

  it("references valid teams and rounds", () => {
    const teamCodes = new Set(seedTeams.map((team) => team.code));
    const roundIds = new Set(seedRounds.map((round) => round.id));

    for (const team of seedTeams) {
      expect(team.flagUrl).toMatch(/^https:\/\/flagcdn\.com\/w160\//);
    }

    for (const match of seedMatches) {
      expect(roundIds.has(match.roundId)).toBe(true);
      if (match.homeCode) expect(teamCodes.has(match.homeCode)).toBe(true);
      if (match.awayCode) expect(teamCodes.has(match.awayCode)).toBe(true);
    }
  });

  it("keeps match numbers and fixtures unique", () => {
    const fixtureKeys = new Set<string>();

    for (const match of seedMatches) {
      expect(match.matchNumber).toBeGreaterThanOrEqual(1);
      expect(match.matchNumber).toBeLessThanOrEqual(104);

      const fixtureKey = [
        match.kickoffAt,
        match.homeCode ?? match.homeSlot,
        match.awayCode ?? match.awaySlot,
        match.venue
      ].join("|");
      expect(fixtureKeys.has(fixtureKey)).toBe(false);
      fixtureKeys.add(fixtureKey);
    }
  });

  it("syncs round deadlines to the first kickoff in each round", () => {
    for (const round of seedRounds) {
      const firstKickoff = seedMatches
        .filter((match) => match.roundId === round.id)
        .map((match) => match.kickoffAt)
        .sort()[0];

      expect(round.deadline).toBe(firstKickoff);
    }
  });
});
