import { AppHeader } from "@/components/app-header";
import { PersonalTournament } from "@/components/personal-tournament";
import { getBootstrapData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function YouPage() {
  try {
    const data = await getBootstrapData();
    const currentRow = data.leaderboard.find((row) => row.user.id === data.currentUser?.id);

    return (
      <main className="shell">
        <AppHeader active="you" participantCount={data.leaderboard.length} />
        <section className="leaderboard-page">
          {currentRow ? (
            <PersonalTournament row={currentRow} />
          ) : (
            <section className="panel personal-board">
              <div className="section-title">
                <div>
                  <span className="eyebrow">Your tournament</span>
                  <h2>No picks yet</h2>
                  <p className="muted">Make your first prediction and your tournament view will appear here.</p>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";

    return (
      <main className="shell">
        <AppHeader active="you" />
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
