import { AppHeader } from "@/components/app-header";
import { PredictionExperience } from "@/components/prediction-experience";
import { getPredictionData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const data = await getPredictionData();

    return (
      <main className="shell">
        <AppHeader active="predict" participantCount={data.participantCount} />

        <PredictionExperience data={data} />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";

    return (
      <main className="shell">
        <AppHeader active="predict" />
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
