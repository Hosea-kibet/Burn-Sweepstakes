type KnockoutEntry = {
  id: string;
  fullName: string;
  assignedTeam: string | null;
  eliminationMessage: string | null;
};

export function KnockoutBoard({
  entries,
  title = "Knocked out list",
}: {
  entries: KnockoutEntry[];
  title?: string;
}) {
  return (
    <section className="panel">
      <div className="portal-section-head">
        <div>
          <p className="eyebrow">Knockout board</p>
          <h2>{title}</h2>
        </div>
        <span>{entries.length} teams out</span>
      </div>
      {entries.length === 0 ? (
        <p className="helper-text">
          Nobody has been sent home yet. The jokes are still stretching.
        </p>
      ) : (
        <div className="knockout-grid">
          {entries.map((participant) => (
            <article key={participant.id} className="knockout-card">
              <strong>{participant.fullName}</strong>
              <span>{participant.assignedTeam ?? "Team pending"}</span>
              <p>{participant.eliminationMessage}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
