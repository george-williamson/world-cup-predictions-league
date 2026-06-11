import { Sparkles, Trophy } from "lucide-react";

import type { LeaderboardRow } from "@/lib/domain";

export function PersonalTournament({ row }: { row: LeaderboardRow }) {
  return (
    <section className="panel personal-board">
      <div className="section-title">
        <div>
          <span className="eyebrow">Your tournament</span>
          <h2>
            {row.user.firstName} {row.user.lastName}
          </h2>
          <p className="muted">Your picks, accuracy, and round-by-round scoring in one place.</p>
        </div>
        <Sparkles size={22} />
      </div>

      <div className="summary-grid">
        <Metric label="Total picks" value={row.predicted.toString()} />
        <Metric label="Accuracy" value={`${row.accuracy}%`} />
        <Metric label="Correct" value={`${row.correct}/${row.scored}`} />
      </div>

      <div className="history leaderboard-history">
        <div className="section-title">
          <h3>Your round history</h3>
          <Trophy size={18} />
        </div>
        {row.roundAccuracy.map((round) => (
          <div className="history-row" key={round.roundId}>
            <span>{round.roundName}</span>
            <strong>{round.scored === 0 ? "Pending" : `${round.accuracy}% (${round.correct}/${round.scored})`}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
