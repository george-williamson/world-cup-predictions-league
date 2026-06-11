import { describe, expect, it } from "vitest";

import { seedTeams } from "@/lib/seed-data";
import { getSweepstakeOwner, sweepstakeAllocations } from "@/lib/sweepstake";

describe("sweepstake allocations", () => {
  it("maps screenshot allocations to seeded teams without duplicate team owners", () => {
    const teamCodes = new Set(seedTeams.map((team) => team.code));
    const allocatedCodes = new Set<string>();

    for (const allocation of sweepstakeAllocations) {
      expect(teamCodes.has(allocation.teamCode)).toBe(true);
      expect(allocatedCodes.has(allocation.teamCode)).toBe(false);
      allocatedCodes.add(allocation.teamCode);
    }
  });

  it("leaves the Norway row unassigned until the source list is corrected", () => {
    expect(getSweepstakeOwner("NOR")).toBeNull();
  });
});
