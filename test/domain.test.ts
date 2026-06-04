import { describe, expect, it } from "vitest";

import { calculateLeagueScore, isPredictionAllowed, isTomoroEmail, rankLeaderboard, scorePrediction } from "@/lib/domain";

describe("email validation", () => {
  it("accepts tomoro.ai email addresses", () => {
    expect(isTomoroEmail("george@tomoro.ai")).toBe(true);
    expect(isTomoroEmail("GEORGE@TOMORO.AI")).toBe(true);
  });

  it("rejects non-tomoro domains", () => {
    expect(isTomoroEmail("george@example.com")).toBe(false);
    expect(isTomoroEmail("george@tomoro.ai.evil.com")).toBe(false);
  });
});

describe("prediction locking", () => {
  it("allows predictions before both kickoff and round deadline", () => {
    expect(
      isPredictionAllowed(
        {
          type: "group",
          kickoffAt: new Date("2026-06-11T20:00:00Z"),
          round: { deadline: new Date("2026-06-11T19:00:00Z") }
        },
        new Date("2026-06-11T18:59:00Z")
      )
    ).toBe(true);
  });

  it("locks predictions at the earlier of kickoff or round deadline", () => {
    expect(
      isPredictionAllowed(
        {
          type: "group",
          kickoffAt: new Date("2026-06-11T20:00:00Z"),
          round: { deadline: new Date("2026-06-11T19:00:00Z") }
        },
        new Date("2026-06-11T19:00:00Z")
      )
    ).toBe(false);
  });

  it("locks knockout predictions until the group stage is complete", () => {
    const knockoutMatch = {
      type: "knockout" as const,
      kickoffAt: new Date("2026-06-28T20:00:00Z"),
      round: { deadline: new Date("2026-06-28T19:00:00Z") }
    };

    expect(isPredictionAllowed(knockoutMatch, new Date("2026-06-20T12:00:00Z"), { groupStageComplete: false })).toBe(false);
    expect(isPredictionAllowed(knockoutMatch, new Date("2026-06-20T12:00:00Z"), { groupStageComplete: true })).toBe(true);
  });
});

describe("scoring", () => {
  it("scores correct group-stage outcomes", () => {
    expect(scorePrediction({ prediction: "draw" }, { status: "final", actualOutcome: "draw" })).toBe(true);
    expect(scorePrediction({ prediction: "home" }, { status: "final", actualOutcome: "away" })).toBe(false);
  });

  it("does not score unfinished matches", () => {
    expect(scorePrediction({ prediction: "home" }, { status: "scheduled", actualOutcome: null })).toBeNull();
  });
});

describe("leaderboard ranking", () => {
  it("ranks by accuracy, correct predictions, scored matches, then earliest completion", () => {
    const ranked = rankLeaderboard([
      {
        user: { id: "late", firstName: "Late", lastName: "User", email: "late@tomoro.ai" },
        predicted: 3,
        scored: 2,
        correct: 2,
        accuracy: 100,
        leagueScore: 100,
        participation: 100,
        lastPredictionAt: new Date("2026-06-10T12:00:00Z"),
        roundAccuracy: []
      },
      {
        user: { id: "early", firstName: "Early", lastName: "User", email: "early@tomoro.ai" },
        predicted: 3,
        scored: 2,
        correct: 2,
        accuracy: 100,
        leagueScore: 100,
        participation: 100,
        lastPredictionAt: new Date("2026-06-10T10:00:00Z"),
        roundAccuracy: []
      },
      {
        user: { id: "lower", firstName: "Lower", lastName: "User", email: "lower@tomoro.ai" },
        predicted: 3,
        scored: 3,
        correct: 2,
        accuracy: 67,
        leagueScore: 67,
        participation: 100,
        lastPredictionAt: new Date("2026-06-10T09:00:00Z"),
        roundAccuracy: []
      }
    ]);

    expect(ranked.map((row) => row.user.id)).toEqual(["early", "late", "lower"]);
  });

  it("uses league score so active predictors rank above tiny perfect samples", () => {
    const ranked = rankLeaderboard([
      {
        user: { id: "tiny", firstName: "Tiny", lastName: "Sample", email: "tiny@tomoro.ai" },
        predicted: 1,
        scored: 1,
        correct: 1,
        accuracy: 100,
        ...calculateLeagueScore({ accuracy: 100, predicted: 1, scored: 1, maxPredicted: 10 }),
        lastPredictionAt: new Date("2026-06-10T10:00:00Z"),
        roundAccuracy: []
      },
      {
        user: { id: "active", firstName: "Active", lastName: "Predictor", email: "active@tomoro.ai" },
        predicted: 10,
        scored: 10,
        correct: 8,
        accuracy: 80,
        ...calculateLeagueScore({ accuracy: 80, predicted: 10, scored: 10, maxPredicted: 10 }),
        lastPredictionAt: new Date("2026-06-10T12:00:00Z"),
        roundAccuracy: []
      }
    ]);

    expect(ranked.map((row) => row.user.id)).toEqual(["active", "tiny"]);
    expect(ranked[0].leagueScore).toBeGreaterThan(ranked[1].leagueScore);
  });
});
