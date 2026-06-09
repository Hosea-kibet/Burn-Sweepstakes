import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="auth-shell">
      <section className="panel auth-panel">
        <p className="eyebrow">Admin login</p>
        <h1>Open the organiser dashboard</h1>
        <p className="hero-text">
          Sign in with the admin token to run the draw and monitor every
          participant.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
