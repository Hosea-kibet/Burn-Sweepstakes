"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WORLD_CUP_TEAMS } from "@/lib/teams";
import type { SweepstakeSummary } from "@/lib/sweepstakes";

type MessageState = {
  text: string;
  tone: "success" | "error";
} | null;

const initialFormState = {
  fullName: "",
  email: "",
  department: "",
  phone: "",
  location: "",
  pin: "",
  teamPreferences: [] as string[],
};

export function SignupForm({
  initialSummary,
}: {
  initialSummary: SweepstakeSummary;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<MessageState>(null);
  const [isPending, startTransition] = useTransition();

  function toggleTeamPreference(team: string) {
    setFormData((current) => {
      if (current.teamPreferences.includes(team)) {
        return {
          ...current,
          teamPreferences: current.teamPreferences.filter(
            (selectedTeam) => selectedTeam !== team,
          ),
        };
      }

      if (current.teamPreferences.length >= 3) {
        return current;
      }

      return {
        ...current,
        teamPreferences: [...current.teamPreferences, team],
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (formData.teamPreferences.length === 0 || formData.teamPreferences.length > 3) {
      setMessage({
        text: "Choose up to three preferred teams before submitting.",
        tone: "error",
      });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const payload = (await response.json()) as {
        message: string;
        summary?: SweepstakeSummary;
      };

      if (!response.ok) {
        setMessage({ text: payload.message, tone: "error" });
        return;
      }

      if (payload.summary) {
        setSummary(payload.summary);
      }

      const submittedEmail = formData.email;
      setFormData(initialFormState);
      setMessage({ text: payload.message, tone: "success" });
      router.push(`/login?email=${encodeURIComponent(submittedEmail)}`);
      router.refresh();
    });
  }

  return (
    <aside className="signup-panel" id="signup">
      <p className="eyebrow">Sign up</p>
      <h2>Claim one of the first 48 places</h2>
      <p>
        Accepted entries are capped at 48 and each person may only enter once.
        Each participant picks up to three preferred teams before the admin runs
        the draw.
      </p>

      {!summary.configured ? (
        <p className="message-text error">
          The database is not configured yet. Add `DATABASE_URL` before
          accepting live signups.
        </p>
      ) : null}

      <div className={`status-pill ${summary.isFull ? "full" : "open"}`}>
        {summary.isFull
          ? "Entries are now full"
          : `${summary.remainingSpots} spots still available`}
      </div>

      <div className="stat-strip">
        <article>
          <strong>{summary.acceptedCount}</strong>
          <span>accepted</span>
        </article>
        <article>
          <strong>{summary.totalSpots}</strong>
          <span>total slots</span>
        </article>
        <article>
          <strong>Ksh {summary.entryFee.toLocaleString()}</strong>
          <span>entry fee</span>
        </article>
      </div>

      <div className="meta-grid">
        <article>
          <strong>Draw method</strong>
          <span>Admin-triggered team assignment once all 48 slots are filled</span>
        </article>
        <article>
          <strong>Pick limit</strong>
          <span>Choose up to 3 preferred teams before the draw</span>
        </article>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            placeholder="Jane Doe"
            value={formData.fullName}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            disabled={isPending || summary.isFull || !summary.configured}
            required
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jane@burn.com"
              value={formData.email}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              disabled={isPending || summary.isFull || !summary.configured}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pin">Login PIN</label>
            <input
              id="pin"
              name="pin"
              type="password"
              placeholder="4 to 8 digits"
              value={formData.pin}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  pin: event.target.value,
                }))
              }
              disabled={isPending || summary.isFull || !summary.configured}
              required
            />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              name="phone"
              placeholder="+254..."
              value={formData.phone}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              disabled={isPending || summary.isFull || !summary.configured}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              name="department"
              placeholder="Finance, Ops, Sales..."
              value={formData.department}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  department: event.target.value,
                }))
              }
              disabled={isPending || summary.isFull || !summary.configured}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            placeholder="Westlands, HQ..."
            value={formData.location}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                location: event.target.value,
              }))
            }
            disabled={isPending || summary.isFull || !summary.configured}
            required
          />
        </div>

        <div className="field">
          <label>Preferred teams</label>
          <p className="helper-text">
            Pick up to 3 teams. The draw prioritises those choices before any
            remaining team is assigned at random.
          </p>
          <div className="team-picker">
            {WORLD_CUP_TEAMS.map((team) => {
              const selected = formData.teamPreferences.includes(team);
              const limitReached =
                formData.teamPreferences.length >= 3 && !selected;

              return (
                <button
                  key={team}
                  className={`team-chip ${selected ? "selected" : ""}`}
                  type="button"
                  onClick={() => toggleTeamPreference(team)}
                  disabled={
                    isPending ||
                    summary.isFull ||
                    !summary.configured ||
                    limitReached
                  }
                >
                  {team}
                </button>
              );
            })}
          </div>
          <p className="helper-text">
            Selected:{" "}
            {formData.teamPreferences.length > 0
              ? formData.teamPreferences.join(", ")
              : "None yet"}
          </p>
        </div>

        <p className="helper-text">
          Accepted participants will be added to the Teams group for payment
          instructions and proof-of-payment sharing. Your PIN will be used to
          log in to your participant account later.
        </p>

        {message ? (
          <p className={`message-text ${message.tone}`}>{message.text}</p>
        ) : null}

        <button
          className="submit-button"
          type="submit"
          disabled={isPending || summary.isFull || !summary.configured}
        >
          {summary.isFull
            ? "Entries closed"
            : isPending
              ? "Saving your entry..."
              : "Join the sweepstake"}
        </button>
      </form>

      <div className="participant-list">
        <p className="eyebrow">Latest accepted names</p>
        <ul className="participant-list">
          {summary.participants.length === 0 ? (
            <li>
              <strong>No names yet</strong>
              <span>The list will start filling as entries come in.</span>
            </li>
          ) : (
            summary.participants
              .slice(-6)
              .reverse()
              .map((participant, index) => (
                <li key={participant.id}>
                  <strong>
                    {summary.acceptedCount - index}. {participant.fullName}
                  </strong>
                  <span>
                    {participant.assignedTeam
                      ? `${participant.assignedTeam} • ${participant.status}`
                      : participant.teamPreferences.join(", ")}
                  </span>
                </li>
              ))
          )}
        </ul>
      </div>
    </aside>
  );
}
