import { LogoutButton } from "@/components/logout-button";
import { ParticipantPortal } from "@/components/participant-portal";
import { requireParticipantSession } from "@/lib/auth";
import { getParticipantTracker, getSweepstakeSummary } from "@/lib/sweepstakes";

export default async function PortalPage() {
  const session = await requireParticipantSession();
  const [tracker, summary] = await Promise.all([
    getParticipantTracker(session.email),
    getSweepstakeSummary(),
  ]);

  return (
    <main className="page-shell">
      <div className="page-topbar">
        <div>
          <p className="eyebrow">Participant portal</p>
          <h1 className="page-title">Your World Cup account</h1>
        </div>
        <LogoutButton redirectTo="/" />
      </div>
      <ParticipantPortal tracker={tracker} summary={summary} />
    </main>
  );
}
