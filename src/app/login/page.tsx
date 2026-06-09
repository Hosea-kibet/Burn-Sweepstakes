import { ParticipantLoginForm } from "@/components/participant-login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="panel auth-panel">
        <p className="eyebrow">Participant login</p>
        <h1>Open your sweepstake account</h1>
        <p className="hero-text">
          Sign in with the email and PIN you created during signup to see your
          team, scores, fixtures, and tournament outlook.
        </p>
        <ParticipantLoginForm initialEmail={params.email ?? ""} />
      </section>
    </main>
  );
}
