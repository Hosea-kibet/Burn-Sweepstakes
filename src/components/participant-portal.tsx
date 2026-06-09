import Image from "next/image";
import type { ParticipantTracker, SweepstakeSummary } from "@/lib/sweepstakes";
import { KnockoutBoard } from "@/components/knockout-board";
import { TournamentStatusGraph } from "@/components/tournament-status-graph";

export function ParticipantPortal({
  tracker,
  summary,
}: {
  tracker: ParticipantTracker;
  summary: SweepstakeSummary;
}) {
  const statusClass =
    tracker.participant.status === "eliminated" ? "full" : "open";

  return (
    <div className="portal-layout">
      <section className="panel tracker-card portal-card">
        <div className="tracker-header">
          <div>
            <p className="eyebrow">My account</p>
            <h2>{tracker.participant.fullName}</h2>
            <div className={`status-pill ${statusClass}`}>
              {tracker.participant.status === "pending"
                ? "Waiting for the draw"
                : tracker.participant.status === "eliminated"
                  ? "Team knocked out"
                  : tracker.participant.status === "winner"
                    ? "Prize winner"
                    : "Still alive"}
            </div>
          </div>
          {tracker.teamSnapshot?.badgeUrl ? (
            <Image
              src={tracker.teamSnapshot.badgeUrl}
              alt={tracker.teamSnapshot.teamName}
              width={88}
              height={88}
              className="team-badge"
            />
          ) : null}
        </div>

        <div className="tracker-grid">
          <article className="tracker-stat">
            <span>Selected teams</span>
            <strong>{tracker.participant.teamPreferences.join(", ")}</strong>
          </article>
          <article className="tracker-stat">
            <span>Assigned team</span>
            <strong>{tracker.participant.assignedTeam ?? "Not drawn yet"}</strong>
          </article>
          <article className="tracker-stat">
            <span>Assignment result</span>
            <strong>
              {tracker.participant.assignmentRank
                ? `Got choice #${tracker.participant.assignmentRank}`
                : tracker.participant.assignedTeam
                  ? "Random fallback"
                  : "Waiting for draw"}
            </strong>
          </article>
          <article className="tracker-stat">
            <span>Competition</span>
            <strong>{tracker.teamSnapshot?.competition ?? "Pending"}</strong>
          </article>
          <article className="tracker-stat">
            <span>Country</span>
            <strong>{tracker.teamSnapshot?.country ?? "Pending"}</strong>
          </article>
          <article className="tracker-stat">
            <span>Portal status</span>
            <strong>
              {tracker.participant.status === "pending"
                ? "Draw not done yet"
                : tracker.participant.status === "eliminated"
                  ? "Out of the running"
                  : "Still in the hunt"}
            </strong>
          </article>
        </div>

        {tracker.participant.eliminationMessage ? (
          <div className="tracker-alert">
            <p className="eyebrow">Knockout desk</p>
            <p>{tracker.participant.eliminationMessage}</p>
          </div>
        ) : null}

        <div className="fixture-grid">
          <article className="fixture-card">
            <p className="eyebrow">Latest score</p>
            {tracker.teamSnapshot?.lastMatch ? (
              <>
                <h4>{tracker.teamSnapshot.lastMatch.label}</h4>
                <span>{tracker.teamSnapshot.lastMatch.date}</span>
                <span>{tracker.teamSnapshot.lastMatch.status}</span>
                {tracker.teamSnapshot.lastMatch.venue ? (
                  <span>{tracker.teamSnapshot.lastMatch.venue}</span>
                ) : null}
              </>
            ) : (
              <p className="helper-text">No recent match found yet.</p>
            )}
          </article>

          <article className="fixture-card">
            <p className="eyebrow">Next fixture</p>
            {tracker.teamSnapshot?.nextMatch ? (
              <>
                <h4>{tracker.teamSnapshot.nextMatch.label}</h4>
                <span>{tracker.teamSnapshot.nextMatch.date}</span>
                <span>{tracker.teamSnapshot.nextMatch.status}</span>
                {tracker.teamSnapshot.nextMatch.venue ? (
                  <span>{tracker.teamSnapshot.nextMatch.venue}</span>
                ) : null}
              </>
            ) : (
              <p className="helper-text">No upcoming match found yet.</p>
            )}
          </article>
        </div>
      </section>

      <TournamentStatusGraph participants={summary.participants} />
      <KnockoutBoard entries={summary.eliminatedParticipants} />
    </div>
  );
}
