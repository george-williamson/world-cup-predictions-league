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
});
