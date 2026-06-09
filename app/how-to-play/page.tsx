import { CalendarClock, CheckCircle2, ClipboardList, LineChart, Lock, MailCheck, Trophy } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { getLeagueMeta } from "@/lib/queries";

const steps = [
  {
    icon: MailCheck,
    title: "Join with Tomoro email",
    body: "Sign up with your first name, last name, and a @tomoro.ai email address. This keeps the league private to the team."
  },
  {
    icon: ClipboardList,
    title: "Pick match outcomes",
    body: "For group games, choose home win, draw, or away win. For knockout games, choose the team you think will advance."
  },
  {
    icon: CalendarClock,
    title: "Complete each round",
    body: "Matches are grouped into sensible tournament rounds. Aim to complete every match in the current round before its deadline."
  },
  {
    icon: LineChart,
    title: "Track accuracy over time",
    body: "As results are added, the leaderboard timeline shows whether each predictor is getting hotter or colder across the tournament."
  }
];

const faqs = [
  {
    question: "Can I predict future rounds early?",
    answer: "Yes. You can move ahead and make picks for later rounds when the fixtures are available. You can still change unlocked picks before the relevant deadline."
  },
  {
    question: "When do predictions lock?",
    answer: "A prediction locks at the earlier of the round deadline or that match's kickoff time. Once locked, it cannot be edited."
  },
  {
    question: "How is the leaderboard scored?",
    answer: "Leaderboard accuracy only includes matches with final results. Ranking is by accuracy percentage, then number of correct predictions, then number of scored matches, then earliest completion."
  },
  {
    question: "How do draws work?",
    answer: "Draw is available for group-stage matches. Knockout matches use the team that advances, so there is no draw option there."
  },
  {
    question: "Why does the leaderboard have a timeline?",
    answer: "The timeline shows cumulative accuracy by round, so you can see who improves, collapses, or steadily climbs as the tournament unfolds."
  },
  {
    question: "Who updates the real results?",
    answer: "Results are synced automatically from the score provider after matches finish. Once a result is marked final, everyone’s accuracy updates automatically."
  }
];

export const dynamic = "force-dynamic";

export default async function HowToPlayPage() {
  const meta = await getLeagueMeta();

  return (
    <main className="shell">
      <AppHeader active="info" participantCount={meta.participantCount} />

      <section className="info-hero">
        <div>
          <span className="eyebrow">Rules and FAQ</span>
          <h2>How to play</h2>
          <p>
            Make your picks round by round, lock them in before the deadline, and watch the accuracy race change as the World Cup unfolds.
          </p>
        </div>
        <div className="info-scorecard">
          <Trophy size={28} />
          <strong>Simple rule</strong>
          <span>Correct outcome = better accuracy</span>
        </div>
      </section>

      <section className="how-steps" aria-label="How to play steps">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <article className="how-step card" key={step.title}>
              <span>
                <Icon size={22} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          );
        })}
      </section>

      <section className="panel rules-panel">
        <div className="section-title">
          <div>
            <h2>Game rules</h2>
            <p className="muted">The important bits, without making it feel like tax paperwork.</p>
          </div>
          <CheckCircle2 size={22} />
        </div>

        <div className="rules-list">
          <div>
            <Lock size={18} />
            <strong>Locked means locked</strong>
            <span>Once a match or round deadline passes, those picks are final.</span>
          </div>
          <div>
            <ClipboardList size={18} />
            <strong>Complete the round</strong>
            <span>The intended game is to pick every match in the active round.</span>
          </div>
          <div>
            <LineChart size={18} />
            <strong>Accuracy evolves</strong>
            <span>The leaderboard timeline updates only when real results are final.</span>
          </div>
        </div>
      </section>

      <section className="faq-list" aria-label="Frequently asked questions">
        <div className="section-title">
          <div>
            <h2>FAQ</h2>
            <p className="muted">Quick answers for the things people will ask in Slack anyway.</p>
          </div>
        </div>

        {faqs.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
