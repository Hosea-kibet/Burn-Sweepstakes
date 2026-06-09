import { AdminDashboard } from "@/components/admin-dashboard";
import { LogoutButton } from "@/components/logout-button";
import { requireAdminSession } from "@/lib/auth";
import { getSweepstakeSummary } from "@/lib/sweepstakes";

export default async function AdminPage() {
  await requireAdminSession();
  const summary = await getSweepstakeSummary();

  return (
    <main className="page-shell">
      <div className="page-topbar">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="page-title">Sweepstake control room</h1>
        </div>
        <LogoutButton redirectTo="/admin/login" />
      </div>
      <AdminDashboard initialSummary={summary} />
    </main>
  );
}
