"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="secondary-button"
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push(redirectTo);
          router.refresh();
        });
      }}
    >
      {isPending ? "Signing out..." : "Log out"}
    </button>
  );
}
