import { AppHeader } from "@/components/app-header";
import { LeaderboardTimeline } from "@/components/leaderboard-timeline";
import { getBootstrapData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  try {
    const data = await getBootstrapData();

    return (
      <main className="shell">
        <AppHeader active="leaderboard" participantCount={data.leaderboard.length} />
        <LeaderboardTimeline rows={data.leaderboard} rounds={data.rounds} currentUserId={data.currentUser?.id} />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";

    return (
      <main className="shell">
        <AppHeader active="leaderboard" />
        <section className="panel">
          <h2>Database setup needed</h2>
          <p className="muted">{message}</p>
          <div className="setup">
            Add `DATABASE_URL` to `.env.local`, then run `pnpm db:push` and `pnpm db:seed`.
          </div>
        </section>
      </main>
    );
  }
}
