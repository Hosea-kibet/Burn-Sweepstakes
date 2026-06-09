"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
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
        body: JSON.stringify({ email, pin }),
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
        <label htmlFor="adminLoginEmail">Admin email</label>
        <input
          id="adminLoginEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="organiser@burn.com"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="adminLoginPin">Admin PIN</label>
        <input
          id="adminLoginPin"
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="4 to 8 digits"
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
