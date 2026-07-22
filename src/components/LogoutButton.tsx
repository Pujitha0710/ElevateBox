"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ErrorResponse = {
  message?: string;
};

export default function LogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout(): Promise<void> {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const responseBody = (await response
        .json()
        .catch(() => null)) as ErrorResponse | null;

      if (!response.ok) {
        throw new Error(responseBody?.message ?? "Unable to log out.");
      }

      router.replace("/login");
      router.refresh();
    } catch (logoutError: unknown) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Unable to log out.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="logout-control">
      <button
        className="button button-secondary"
        type="button"
        disabled={isLoading}
        onClick={() => void logout()}
      >
        {isLoading ? "Logging out..." : "Log out"}
      </button>

      {error ? (
        <span className="inline-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
