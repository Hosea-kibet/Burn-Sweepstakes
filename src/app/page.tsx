import { SignupForm } from "@/components/signup-form";
import { getSweepstakeSummary } from "@/lib/sweepstakes";

const prizeBreakdown = [
  { place: "1st Place", amount: "Ksh 28,800", share: "60%" },
  { place: "2nd Place", amount: "Ksh 14,400", share: "30%" },
  { place: "3rd Place", amount: "Ksh 4,800", share: "10%" },
];

const steps = [
  "The sweepstake is limited to 48 participants from BURN West, and each person can submit one entry only.",
  "Every participant chooses up to three preferred World Cup teams and sets a login PIN during signup.",
  "Participants log in to their own account to track their assigned team, scores, fixtures, and tournament progress.",
  "The admin logs in separately to trigger the draw and monitor how every participant is faring.",
  "As the World Cup unfolds, the dashboard turns into a tournament deep dive with live knockouts and status graphs.",
];

export default async function Home() {
  const summary = await getSweepstakeSummary();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BURN West private pool</p>
          <h1>BURN World Cup Sweepstakes</h1>
          <p className="hero-text">
            Sign up once, create your login PIN, choose your three dream teams,
            and come back to your personal portal to follow the World Cup in
            style.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#signup">
              Join the sweepstake
            </a>
            <a className="secondary-button" href="/login">
              Participant login
            </a>
            <a className="secondary-button" href="/admin/login">
              Admin login
            </a>
          </div>
          <div className="hero-notes">
            <div>
              <strong>{summary.acceptedCount}</strong>
              <span>confirmed sign-ups</span>
            </div>
            <div>
              <strong>{summary.remainingSpots}</strong>
              <span>spots still open</span>
            </div>
            <div>
              <strong>{summary.drawCompleted ? "Live" : "Pending"}</strong>
              <span>draw status</span>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <p className="card-kicker">New flow</p>
          <h2>Signup first. Then log in.</h2>
          <p>
            The public page is now just the front door. Participants and admin
            each have their own separate account area once they sign in.
          </p>
          <ul className="mini-list">
            <li>Participant login with email + PIN</li>
            <li>Admin login with organiser token</li>
            <li>Private dashboards with tournament insights</li>
          </ul>
        </div>
      </section>

      <section className="content-grid">
        <div className="stack">
          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">How it works</p>
              <h2>The sweepstake in five quick steps</h2>
            </div>
            <div className="rules-list">
              {steps.map((step) => (
                <article key={step} className="rule-card">
                  <span className="rule-dot" />
                  <p>{step}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Prize breakdown</p>
              <h2>Ksh 48,000 on the table</h2>
            </div>
            <div className="prize-grid">
              {prizeBreakdown.map((prize) => (
                <article key={prize.place} className="prize-card">
                  <p>{prize.place}</p>
                  <h3>{prize.amount}</h3>
                  <span>{prize.share} of the total pool</span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <SignupForm initialSummary={summary} />
      </section>
    </main>
  );
}
