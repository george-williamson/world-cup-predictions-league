import type { Match, Prediction, Round, Team, User } from "@/db/schema";

export type PredictionValue = "home" | "draw" | "away";

export type MatchWithTeams = Match & {
  round: Round;
  homeTeam: Team | null;
  awayTeam: Team | null;
  userPrediction?: Prediction | null;
};

export type LeaderboardRow = {
  user: Pick<User, "id" | "firstName" | "lastName" | "email">;
  predicted: number;
  scored: number;
  correct: number;
  accuracy: number;
  leagueScore: number;
  participation: number;
  lastPredictionAt: Date | null;
  roundAccuracy: Array<{
    roundId: string;
    roundName: string;
    correct: number;
    scored: number;
    accuracy: number;
  }>;
};

export function isTomoroEmail(email: string) {
  return /^[^\s@]+@tomoro\.ai$/i.test(email.trim());
}

export function isPredictionAllowed(
  match: Pick<MatchWithTeams, "round" | "kickoffAt" | "type">,
  now = new Date(),
  options: { groupStageComplete?: boolean } = {}
) {
  if (match.type === "knockout" && options.groupStageComplete === false) {
    return false;
  }

  const cutoff = new Date(Math.min(match.round.deadline.getTime(), match.kickoffAt.getTime()));
  return now < cutoff;
}

export function isGroupStageComplete(matches: Array<Pick<Match, "type" | "status">>) {
  const groupMatches = matches.filter((match) => match.type === "group");
  return groupMatches.length > 0 && groupMatches.every((match) => match.status === "final");
}

export function getAvailablePredictions(match: Pick<MatchWithTeams, "type">): PredictionValue[] {
  return match.type === "group" ? ["home", "draw", "away"] : ["home", "away"];
}

export function predictionLabel(value: PredictionValue, match: MatchWithTeams) {
  if (value === "draw") {
    return "Draw";
  }

  const team = value === "home" ? match.homeTeam : match.awayTeam;
  return match.type === "knockout" ? `${team?.name ?? "Team"} advances` : `${team?.name ?? "Team"} win`;
}

export function scorePrediction(
  prediction: Pick<Prediction, "prediction">,
  match: Pick<Match, "status" | "actualOutcome">
) {
  if (match.status !== "final" || !match.actualOutcome) {
    return null;
  }

  return prediction.prediction === match.actualOutcome;
}

export function rankLeaderboard(rows: LeaderboardRow[]) {
  return [...rows].sort((a, b) => {
    if (b.leagueScore !== a.leagueScore) return b.leagueScore - a.leagueScore;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.participation !== a.participation) return b.participation - a.participation;
    if (b.correct !== a.correct) return b.correct - a.correct;
    if (b.scored !== a.scored) return b.scored - a.scored;
    const aTime = a.lastPredictionAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.lastPredictionAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

export function calculateLeagueScore({
  accuracy,
  predicted,
  maxPredicted,
  scored
}: {
  accuracy: number;
  predicted: number;
  maxPredicted: number;
  scored: number;
}) {
  const participation = maxPredicted === 0 ? 0 : Math.round((predicted / maxPredicted) * 100);

  if (scored === 0) {
    return { leagueScore: participation, participation };
  }

  return {
    leagueScore: Math.round(accuracy * 0.7 + participation * 0.3),
    participation
  };
}
