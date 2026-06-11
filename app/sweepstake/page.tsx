import { BadgeX, Goal, Shield, Square, Trophy } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { getSweepstakePageData } from "@/lib/queries";
import type { SweepstakePrize } from "@/lib/sweepstake";

const prizeIcons = {
  winner: Trophy,
  "most-goals": Goal,
  "best-defence": Shield,
  "most-red-cards": Square,
  "most-own-goals": BadgeX
} satisfies Record<SweepstakePrize["id"], typeof Trophy>;

export const dynamic = "force-dynamic";

export default async function SweepstakePage() {
  try {
    const data = await getSweepstakePageData();
    const leaderByPrize = new Map(data.awardLeaders.map((leader) => [leader.prizeId, leader]));

    return (
      <main className="shell">
        <AppHeader active="sweepstake" participantCount={data.participantCount} />

        <section className="sweepstake-page">
          <div className="sweepstake-hero">
            <div>
              <span className="eyebrow">Team sweepstake</span>
              <h2>Allocations and prizes</h2>
            </div>
            <div className="sweepstake-total">
              <span>Prize split</span>
              <strong>60 / 10 / 10 / 10 / 10</strong>
            </div>
          </div>

          <div className="sweepstake-layout">
            <section className="panel sweepstake-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Draw</span>
                  <h3>Teams by person</h3>
                </div>
                <span>{data.allocations.length} entrants</span>
              </div>

              <div className="allocation-list">
                {data.allocations.map((allocation) => (
                  <div className="allocation-row" key={allocation.owner}>
                    <strong>{allocation.owner}</strong>
                    <div>
                      {allocation.teams.map((team) => (
                        <span className="team-token" key={team.code}>
                          {team.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="sweepstake-side">
              <section className="panel sweepstake-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Prizes</span>
                    <h3>Awards</h3>
                  </div>
                </div>

                <div className="prize-list">
                  {data.prizes.map((prize) => {
                    const Icon = prizeIcons[prize.id];
                    const leader = leaderByPrize.get(prize.id);

                    return (
                      <div className="prize-row" key={prize.id} data-status={leader?.status ?? "pending"}>
                        <span className="prize-icon">
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{prize.label}</strong>
                          <span>{leader?.label ?? "Pending"}</span>
                          {leader?.owner ? <small>{leader.owner}</small> : null}
                        </div>
                        <b>{prize.share}%</b>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="panel sweepstake-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Data</span>
                    <h3>Award tracking</h3>
                  </div>
                </div>
                <div className="award-notes">
                  {data.awardLeaders.map((leader) => (
                    <div key={leader.prizeId} data-status={leader.status}>
                      <strong>{leader.label}</strong>
                      <span>{leader.detail}</span>
                    </div>
                  ))}
                </div>
              </section>

              {data.unallocatedTeams.length ? (
                <section className="panel sweepstake-panel">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">To confirm</span>
                      <h3>Unallocated</h3>
                    </div>
                  </div>
                  <div className="unallocated-list">
                    {data.unallocatedTeams.map((team) => (
                      <span className="team-token" key={team.code}>
                        {team.name}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </section>
      </main>
    );
  } catch {
    return (
      <main className="shell">
        <AppHeader active="sweepstake" />
        <section className="setup">Add `DATABASE_URL` to `.env.local`, then run `pnpm db:push` and `pnpm db:seed`.</section>
      </main>
    );
  }
}
