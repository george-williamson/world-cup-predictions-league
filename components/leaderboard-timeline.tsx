"use client";

import { useState } from "react";
import { ListOrdered, Medal, TrendingUp } from "lucide-react";

import type { Round } from "@/db/schema";
import type { LeaderboardRow } from "@/lib/domain";

const palette = ["#d8ff00", "#ff7a59", "#65d8ff", "#f4c542", "#ad7bf9", "#40c977", "#fa423e", "#f8fafc"];

type ViewMode = "standings" | "timeline";

export function LeaderboardTimeline({
  rows,
  rounds,
  currentUserId
}: {
  rows: LeaderboardRow[];
  rounds: Round[];
  currentUserId?: string | null;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("standings");
  const totalPredictions = rows.reduce((sum, row) => sum + row.predicted, 0);
  const scoredPredictions = rows.reduce((sum, row) => sum + row.scored, 0);
  const maxPredicted = Math.max(0, ...rows.map((row) => row.predicted));
  const series = rows.map((row, index) => ({
    row,
    color: palette[index % palette.length],
    points: cumulativePoints(row, rounds)
  }));

  return (
    <section className="leaderboard-page">
      <div className="race-board panel">
        <div className="race-board-header">
          <div>
            <span className="eyebrow">Team standings</span>
            <h2>{viewMode === "standings" ? "Full leaderboard" : "Accuracy timeline"}</h2>
            <p className="muted">
              {viewMode === "standings"
                ? "Current order ranked by league score: accuracy blended with participation."
                : "Every predictor is plotted on the same axes, so overlaps and changes in the race are visible."}
            </p>
          </div>
          <div className="view-toggle" aria-label="Leaderboard view">
            <button aria-pressed={viewMode === "standings"} type="button" onClick={() => setViewMode("standings")}>
              <ListOrdered size={17} />
              Standings
            </button>
            <button aria-pressed={viewMode === "timeline"} type="button" onClick={() => setViewMode("timeline")}>
              <TrendingUp size={17} />
              Timeline
            </button>
          </div>
        </div>

        {viewMode === "standings" ? (
          <StandingsBoard rows={rows} currentUserId={currentUserId} maxPredicted={maxPredicted} />
        ) : (
          <TimelineBoard rounds={rounds} series={series} currentUserId={currentUserId} maxPredicted={maxPredicted} />
        )}
      </div>

      <div className="score-hero score-summary">
        <div>
          <span className="eyebrow">Tournament pulse</span>
          <h2>The prediction race</h2>
          <p className="muted">League score is 70% accuracy and 30% participation once results exist; before results, active predictors rise by participation.</p>
        </div>
        <div className="hero-stats">
          <Metric label="Predictors" value={rows.length.toString()} />
          <Metric label="Picks made" value={totalPredictions.toString()} />
          <Metric label="Scored picks" value={scoredPredictions.toString()} />
        </div>
      </div>
    </section>
  );
}

function StandingsBoard({
  rows,
  currentUserId,
  maxPredicted
}: {
  rows: LeaderboardRow[];
  currentUserId?: string | null;
  maxPredicted: number;
}) {
  return (
    <div className="f1-board">
      <div className="f1-head">
        <span>Pos</span>
        <span>Predictor</span>
        <span>Correct</span>
        <span>Pace</span>
        <span>Score / Accuracy</span>
      </div>
      {rows.length === 0 ? <p className="muted">No predictors yet.</p> : null}
      {rows.map((row, index) => {
        const participation = getParticipation(row, maxPredicted);

        return (
          <div className="f1-row" data-current={row.user.id === currentUserId} key={row.user.id}>
            <span className="f1-position">{index + 1}</span>
            <div className="f1-driver">
              <strong>
                {row.user.firstName} {row.user.lastName}
              </strong>
              <span>{row.user.email}</span>
              <small>
                {row.correct}/{row.scored} · {row.predicted} picks · {participation.label}
              </small>
            </div>
            <strong>
              {row.correct}/{row.scored}
            </strong>
            <div className="participation-cell" data-tone={participation.tone}>
              <span>
                {row.predicted} picks · {participation.label}
              </span>
              <i>
                <b style={{ width: `${participation.percent}%` }} />
              </i>
            </div>
            <span className="f1-accuracy">
              <span className="score-line">
                <Medal size={18} />
                <strong>{row.leagueScore}</strong>
              </span>
              <span className="accuracy-line">{row.accuracy}% acc</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TimelineBoard({
  rounds,
  series,
  currentUserId,
  maxPredicted
}: {
  rounds: Round[];
  series: Array<{
    color: string;
    row: LeaderboardRow;
    points: Array<{ roundId: string; accuracy: number; scored: number }>;
  }>;
  currentUserId?: string | null;
  maxPredicted: number;
}) {
  return (
    <div className="timeline-board">
      {series.length === 0 ? <p className="muted">No timeline data yet.</p> : null}
      <div className="overlap-timeline">
        <div className="timeline-legend-list">
          {series.map(({ row, color }) => {
            const participation = getParticipation(row, maxPredicted);

            return (
              <div className="timeline-name" data-current={row.user.id === currentUserId} data-tone={participation.tone} key={row.user.id}>
                <i style={{ background: color }} />
                <strong>
                  {row.user.firstName} {row.user.lastName}
                </strong>
                <span>
                  Score {row.leagueScore} · {row.accuracy}% accuracy · {row.predicted} picks
                </span>
              </div>
            );
          })}
        </div>
        <CombinedTimeline rounds={rounds} series={series} />
      </div>
    </div>
  );
}

function getParticipation(row: LeaderboardRow, maxPredicted: number) {
  if (row.predicted === 0 || maxPredicted === 0) {
    return { label: "No picks", percent: 0, tone: "danger" };
  }

  const percent = Math.round((row.predicted / maxPredicted) * 100);

  if (percent < 50) {
    return { label: "Dropped back", percent, tone: "danger" };
  }

  if (percent < 85) {
    return { label: "Behind pace", percent, tone: "warn" };
  }

  return { label: "On pace", percent, tone: "good" };
}

function CombinedTimeline({
  rounds,
  series
}: {
  rounds: Round[];
  series: Array<{
    color: string;
    row: LeaderboardRow;
    points: Array<{ roundId: string; accuracy: number; scored: number }>;
  }>;
}) {
  const width = 860;
  const height = 390;
  const padding = { top: 24, right: 26, bottom: 54, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) => padding.left + (rounds.length <= 1 ? 0 : (chartWidth / (rounds.length - 1)) * index);
  const yFor = (accuracy: number) => padding.top + chartHeight - (chartHeight * accuracy) / 100;

  return (
    <div className="combined-timeline" role="img" aria-label="Overlapping cumulative accuracy lines by tournament round">
      <svg viewBox={`0 0 ${width} ${height}`}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line className="timeline-grid" x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} />
            <text className="timeline-y-label" x={12} y={yFor(tick) + 4}>
              {tick}%
            </text>
          </g>
        ))}
        {rounds.map((round, index) => (
          <g key={round.id}>
            <line className="timeline-round-guide" x1={xFor(index)} x2={xFor(index)} y1={padding.top} y2={height - padding.bottom} />
            <text className="timeline-x-label" x={xFor(index)} y={height - 22}>
              {shortRound(round.name)}
            </text>
          </g>
        ))}
        {series.map(({ row, color, points }) => {
          const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.accuracy)}`).join(" ");

          return (
            <g key={row.user.id}>
              <path className="timeline-line" d={path} stroke={color} />
              {points.map((point, index) => (
                <circle key={point.roundId} cx={xFor(index)} cy={yFor(point.accuracy)} r={point.scored > 0 ? 4.5 : 3.5} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="timeline-mobile-rounds">
        {rounds.map((round) => (
          <span key={round.id}>{shortRound(round.name)}</span>
        ))}
      </div>
    </div>
  );
}

function cumulativePoints(row: LeaderboardRow, rounds: Round[]) {
  let correct = 0;
  let scored = 0;

  return rounds.map((round) => {
    const roundResult = row.roundAccuracy.find((item) => item.roundId === round.id);
    correct += roundResult?.correct ?? 0;
    scored += roundResult?.scored ?? 0;

    return {
      roundId: round.id,
      accuracy: scored === 0 ? 0 : Math.round((correct / scored) * 100),
      scored
    };
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function shortRound(name: string) {
  return name
    .replace("Group Stage - ", "G")
    .replace("Round of ", "R")
    .replace("Quarter-finals", "QF")
    .replace("Semi-finals", "SF")
    .replace("Third-place play-off", "3rd")
    .replace("Final", "Final");
}
