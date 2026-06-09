"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KnockoutBoard } from "@/components/knockout-board";
import { TournamentStatusGraph } from "@/components/tournament-status-graph";
import type { SweepstakeSummary } from "@/lib/sweepstakes";
import { WORLD_CUP_TEAMS } from "@/lib/teams";

type MessageState = {
  text: string;
  tone: "success" | "error";
} | null;

export function AdminDashboard({
  initialSummary,
}: {
  initialSummary: SweepstakeSummary;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [selectedTeam, setSelectedTeam] = useState<string>(WORLD_CUP_TEAMS[0]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isPending, startTransition] = useTransition();

  async function sendRequest(
    url: string,
    body: Record<string, boolean | string>,
  ) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

    setMessage({ text: payload.message, tone: "success" });
    router.refresh();
  }

  return (
    <div className="portal-layout">
      <section className="panel admin-panel">
        <p className="eyebrow">Admin dashboard</p>
        <h2>Run the draw and monitor everyone</h2>
        <p>
          Trigger the draw when all 48 slots are filled, mark teams knocked out,
          and follow how every participant is doing.
        </p>

        <div className="stat-strip">
          <article>
            <strong>{summary.acceptedCount}</strong>
            <span>accepted</span>
          </article>
          <article>
            <strong>{summary.remainingSpots}</strong>
            <span>remaining</span>
          </article>
          <article>
            <strong>{summary.drawCompleted ? "Done" : "Pending"}</strong>
            <span>draw status</span>
          </article>
        </div>

        <div className="admin-actions">
          <button
            className="submit-button"
            type="button"
            disabled={isPending || summary.acceptedCount !== summary.totalSpots}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                await sendRequest("/api/admin/draw", {});
              });
            }}
          >
            {isPending ? "Working..." : "Trigger draw"}
          </button>
          <p className="helper-text">
            The draw unlocks only when all 48 participant slots are filled.
          </p>
        </div>

        <div className="field">
          <label htmlFor="teamStatus">Competition tracking</label>
          <select
            id="teamStatus"
            value={selectedTeam}
            onChange={(event) => setSelectedTeam(event.target.value)}
            disabled={isPending}
          >
            {WORLD_CUP_TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-button-row">
          <button
            className="secondary-button"
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                await sendRequest("/api/admin/eliminations", {
                  teamName: selectedTeam,
                  eliminated: true,
                });
              });
            }}
          >
            Mark knocked out
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                await sendRequest("/api/admin/eliminations", {
                  teamName: selectedTeam,
                  eliminated: false,
                });
              });
            }}
          >
            Restore team
          </button>
        </div>

        {message ? (
          <p className={`message-text ${message.tone}`}>{message.text}</p>
        ) : null}

        <div className="participant-board">
          {summary.participants.map((participant) => (
            <article key={participant.id} className="participant-row-card">
              <strong>{participant.fullName}</strong>
              <span>
                {participant.assignedTeam
                  ? `${participant.assignedTeam} • ${participant.status}`
                  : participant.teamPreferences.join(", ")}
              </span>
            </article>
          ))}
        </div>
      </section>

      <TournamentStatusGraph participants={summary.participants} />
      <KnockoutBoard entries={summary.eliminatedParticipants} title="Eliminated teams" />
    </div>
  );
}
