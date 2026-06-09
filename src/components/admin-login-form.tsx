"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json()) as { message: string };

      if (!response.ok) {
        setMessage(payload.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="adminLoginToken">Admin token</label>
        <input
          id="adminLoginToken"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Enter the organiser token"
          required
        />
      </div>
      {message ? <p className="message-text error">{message}</p> : null}
      <button className="submit-button" type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Open admin dashboard"}
      </button>
    </form>
  );
}
