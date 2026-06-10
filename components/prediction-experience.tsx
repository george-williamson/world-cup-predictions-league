"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarClock, Handshake, Lock, Target } from "lucide-react";

import { savePredictionAction, type ActionState } from "@/app/actions";
import type { Round, User } from "@/db/schema";
import {
  getAvailablePredictions,
  isPredictionAllowed,
  predictionLabel,
  type MatchWithTeams,
  type PredictionValue
} from "@/lib/domain";

type BootstrapData = {
  currentUser: User | null;
  rounds: Round[];
  matches: MatchWithTeams[];
  groupStageComplete: boolean;
  completion: Array<{ roundId: string; total: number; predicted: number }>;
};

export function PredictionExperience({ data }: { data: BootstrapData }) {
  const firstOpenRound = data.rounds.find((round) =>
    data.matches.some((match) => match.round.id === round.id && isPredictionAllowed(match, new Date(), { groupStageComplete: data.groupStageComplete }))
  );
  const [selectedRoundId, setSelectedRoundId] = useState(firstOpenRound?.id ?? data.rounds[0]?.id);
  const selectedRound = data.rounds.find((round) => round.id === selectedRoundId) ?? data.rounds[0];
  const matches = useMemo(
    () => data.matches.filter((match) => match.round.id === selectedRound?.id),
    [data.matches, selectedRound?.id]
  );
  const selectedCompletion = data.completion.find((item) => item.roundId === selectedRound?.id);

  return (
    <section className="panel prediction-panel">
        <div className="prediction-hero">
          <div className="prediction-hero-copy">
            <span className="eyebrow">Match picks</span>
            <h2>Make predictions</h2>
            <p>
              {data.currentUser?.firstName}, pick every match in the round before it locks.
            </p>
            <span className="deadline-chip">
              <CalendarClock size={16} /> Deadline {selectedRound ? formatDate(selectedRound.deadline) : "pending"}
            </span>
          </div>
          <div className="round-progress">
            <Target size={20} />
            <div>
              <span>Round completion</span>
              <strong>
                {selectedCompletion?.predicted ?? 0}/{selectedCompletion?.total ?? 0}
              </strong>
            </div>
            <div className="progress-track">
              <i
                style={{
                  width: `${selectedCompletion?.total ? Math.round((selectedCompletion.predicted / selectedCompletion.total) * 100) : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounds" aria-label="Rounds">
          {data.rounds.map((round) => {
            const completion = data.completion.find((item) => item.roundId === round.id);
            const lockedUntilGroupDone = round.type === "knockout" && !data.groupStageComplete;
            const locked = lockedUntilGroupDone ? true : new Date() >= round.deadline;

            return (
              <button
                key={round.id}
                className="round-button"
                type="button"
                aria-pressed={round.id === selectedRound?.id}
                data-locked={locked}
                onClick={() => setSelectedRoundId(round.id)}
              >
                <strong>{round.name}</strong>
                <span>
                  {locked ? <Lock size={12} /> : null}
                  {lockedUntilGroupDone
                    ? `Opens after groups · ${completion?.predicted ?? 0}/${completion?.total ?? 0}`
                    : `${locked ? "Locked" : "Open"} · ${completion?.predicted ?? 0}/${completion?.total ?? 0}`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="match-stack">
          {matches.map((match) => (
            <PredictionCard key={match.id} match={match} groupStageComplete={data.groupStageComplete} />
          ))}
        </div>
    </section>
  );
}

function PredictionCard({ match, groupStageComplete }: { match: MatchWithTeams; groupStageComplete: boolean }) {
  const available = getAvailablePredictions(match);
  const isFinal = match.status === "final" && Boolean(match.actualOutcome);
  const locked = isFinal || !isPredictionAllowed(match, new Date(), { groupStageComplete });
  const current = match.userPrediction?.prediction;
  const initialState: ActionState = { ok: false, message: "" };
  const scoredCorrect = isFinal && current ? current === match.actualOutcome : null;
  const finalResultState = scoredCorrect === null ? "unpicked" : scoredCorrect ? "correct" : "incorrect";

  return (
    <article className="card match-card" data-result={scoredCorrect === null ? "pending" : scoredCorrect ? "correct" : "incorrect"}>
      <div className="match-meta">
        <div>
          <span>
            Match {match.matchNumber} · {match.group ? `Group ${match.group}` : match.round.name}
          </span>
          <span className="venue-line">
            <span className="venue-flag" aria-hidden="true">
              {venueHostFlag(match.venue)}
            </span>
            {match.venue}
          </span>
        </div>
        <time>{formatDate(match.kickoffAt)}</time>
      </div>

      <div className="teams" data-mode={available.includes("draw") ? "group" : "knockout"}>
        <TeamPickButton
          match={match}
          prediction="home"
          selected={current === "home"}
          result={resultFor(match, "home")}
          disabled={locked}
          initialState={initialState}
        />
        {available.includes("draw") ? (
          <PredictionButton
            match={match}
            prediction="draw"
            selected={current === "draw"}
            result={resultFor(match, "draw")}
            disabled={locked}
            initialState={initialState}
          />
        ) : (
          <div className="versus">VS</div>
        )}
        <TeamPickButton
          match={match}
          prediction="away"
          selected={current === "away"}
          result={resultFor(match, "away")}
          disabled={locked}
          initialState={initialState}
        />
      </div>

      {isFinal ? (
        <div className="result-panel" data-result={finalResultState}>
          <div className="scoreline" aria-label={`Final score: ${formatScore(match)}`}>
            <span className="scoreline-team">
              <strong>{match.homeScore ?? "-"}</strong>
            </span>
            <span className="scoreline-status">
              <span className="scoreline-divider">FT</span>
            </span>
            <span className="scoreline-team scoreline-team-away">
              <strong>{match.awayScore ?? "-"}</strong>
            </span>
          </div>
        </div>
      ) : locked ? (
        <p className="pill">
          <Lock size={14} /> {match.type === "knockout" && !groupStageComplete ? "Locked until group stage ends" : "Locked"}
        </p>
      ) : null}
    </article>
  );
}

function PredictionButton({
  match,
  prediction,
  selected,
  result,
  disabled,
  initialState
}: {
  match: MatchWithTeams;
  prediction: PredictionValue;
  selected: boolean;
  result: PickResult;
  disabled: boolean;
  initialState: ActionState;
}) {
  const [, action, pending] = useActionState(savePredictionAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="prediction" value={prediction} />
      <button
        aria-label={predictionLabel(prediction, match)}
        className="draw-pick"
        data-result={result.state}
        data-selected={selected}
        disabled={disabled || pending}
        type="submit"
      >
        <span className="draw-label">
          <Handshake size={18} />
          <span>Draw</span>
        </span>
        <small>{formatMarketProbability(result.probability)}</small>
      </button>
    </form>
  );
}

function TeamPickButton({
  match,
  prediction,
  selected,
  result,
  disabled,
  initialState
}: {
  match: MatchWithTeams;
  prediction: Extract<PredictionValue, "home" | "away">;
  selected: boolean;
  result: PickResult;
  disabled: boolean;
  initialState: ActionState;
}) {
  const [, action, pending] = useActionState(savePredictionAction, initialState);
  const team = prediction === "home" ? match.homeTeam : match.awayTeam;
  const name = team?.name ?? (prediction === "home" ? match.homeSlot : match.awaySlot);
  const flagUrl = team?.flagUrl;

  return (
    <form action={action} className="team">
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="prediction" value={prediction} />
      <button
        aria-label={predictionLabel(prediction, match)}
        className="team-pick"
        data-result={result.state}
        data-selected={selected}
        disabled={disabled || pending}
        type="submit"
      >
        <span className="flag-frame">
          {flagUrl ? <img src={flagUrl} alt={`${name} flag`} /> : <span className="team-flag-placeholder" />}
        </span>
        <strong>{name}</strong>
        <small>{formatMarketProbability(result.probability)}</small>
      </button>
    </form>
  );
}

type PickResult = {
  probability: number | null;
  state: "pending" | "actual" | "wrong";
};

function resultFor(match: MatchWithTeams, prediction: PredictionValue): PickResult {
  const probability =
    prediction === "home"
      ? match.homeWinProbability
      : prediction === "draw"
        ? match.drawProbability
        : match.awayWinProbability;

  if (match.status !== "final" || !match.actualOutcome) {
    return { probability, state: "pending" };
  }

  return {
    probability,
    state: match.actualOutcome === prediction ? "actual" : "wrong"
  };
}

function formatScore(match: MatchWithTeams) {
  if (match.homeScore === null || match.awayScore === null) {
    return "result pending";
  }

  return `${match.homeTeam?.name ?? match.homeSlot} ${match.homeScore}-${match.awayScore} ${match.awayTeam?.name ?? match.awaySlot}`;
}

function formatMarketProbability(probability: number | null) {
  return probability === null ? "Market pending" : `${probability}% market`;
}

function venueHostFlag(venue: string) {
  if (/Mexico|Guadalajara|Monterrey|Estadio/i.test(venue)) {
    return "🇲🇽";
  }

  if (/Toronto|Vancouver|BC Place/i.test(venue)) {
    return "🇨🇦";
  }

  return "🇺🇸";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
