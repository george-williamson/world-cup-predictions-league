import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, CircleHelp, Gift, Trophy, UserRound } from "lucide-react";

type AppHeaderProps = {
  active: "predict" | "leaderboard" | "sweepstake" | "you" | "info";
  participantCount?: number;
};

export function AppHeader({ active, participantCount }: AppHeaderProps) {
  const participantLabel =
    participantCount === undefined ? "participants loading" : `${participantCount} ${participantCount === 1 ? "participant" : "participants"}`;

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <img src="/world-cup-clean.png" alt="" aria-hidden="true" />
        </span>
        <span className="brand-copy">
          <span className="brand-kicker">Tomoro team league</span>
          <h1>World Cup Predictions</h1>
          <span className="brand-meta">104 fixtures · 48 teams · {participantLabel}</span>
        </span>
      </Link>
      <div className="topbar-utilities">
        <Link className="utility-link" aria-current={active === "info" ? "page" : undefined} href="/how-to-play">
          <CircleHelp size={17} />
          <span>Info</span>
        </Link>
        <div className="account-menu">
          <UserButton />
        </div>
      </div>
      <div className="header-actions">
        <nav className="main-nav" aria-label="Primary navigation">
          <Link className="nav-link" aria-current={active === "predict" ? "page" : undefined} href="/">
            <Trophy size={17} />
            Predict
          </Link>
          <Link
            className="nav-link"
            aria-current={active === "leaderboard" ? "page" : undefined}
            href="/leaderboard"
          >
            <BarChart3 size={17} />
            <span className="desktop-label">Leaderboard</span>
            <span className="mobile-label">Leaderboard</span>
          </Link>
          <Link className="nav-link" aria-current={active === "sweepstake" ? "page" : undefined} href="/sweepstake">
            <Gift size={17} />
            <span className="desktop-label">Sweepstake</span>
            <span className="mobile-label">Sweep</span>
          </Link>
          <Link className="nav-link" aria-current={active === "you" ? "page" : undefined} href="/you">
            <UserRound size={17} />
            You
          </Link>
        </nav>
      </div>
    </header>
  );
}
