import type { SweepstakeSummary } from "@/lib/sweepstakes";

export function TournamentStatusGraph({
  participants,
}: {
  participants: SweepstakeSummary["participants"];
}) {
  const totals = {
    active: participants.filter((participant) => participant.status === "active").length,
    eliminated: participants.filter((participant) => participant.status === "eliminated").length,
    pending: participants.filter((participant) => participant.status === "pending").length,
    winner: participants.filter((participant) => participant.status === "winner").length,
  };

  const max = Math.max(1, ...Object.values(totals));

  const bars = [
    { label: "Still alive", value: totals.active, className: "graph-fill active" },
    { label: "Knocked out", value: totals.eliminated, className: "graph-fill eliminated" },
    { label: "Waiting for draw", value: totals.pending, className: "graph-fill pending" },
    { label: "Prize winners", value: totals.winner, className: "graph-fill winner" },
  ];

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Tournament graph</p>
        <h2>World Cup deep dive</h2>
      </div>
      <div className="graph-stack">
        {bars.map((bar) => (
          <article key={bar.label} className="graph-row">
            <div className="graph-meta">
              <strong>{bar.label}</strong>
              <span>{bar.value} teams</span>
            </div>
            <div className="graph-track">
              <div
                className={bar.className}
                style={{ width: `${(bar.value / max) * 100}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
