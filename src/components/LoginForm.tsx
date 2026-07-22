"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
};

type LoginFormProps = {
  users: LoginUser[];
};

type ErrorResponse = {
  message?: string;
};

export default function LoginForm({
  users,
}: LoginFormProps) {
  const router = useRouter();

  const [activeEmail, setActiveEmail] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function login(email: string): Promise<void> {
    if (activeEmail !== null) {
      return;
    }

    setActiveEmail(email);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseBody = (await response
        .json()
        .catch(() => null)) as ErrorResponse | null;

      if (!response.ok) {
        throw new Error(
          responseBody?.message ?? "Unable to log in.",
        );
      }

      router.replace("/documents");
      router.refresh();
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to log in.",
      );
    } finally {
      setActiveEmail(null);
    }
  }

  return (
    <div>
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="user-grid">
        {users.map((user) => {
          const isLoading = activeEmail === user.email;
          const isDisabled = activeEmail !== null;

          return (
            <article className="user-card" key={user.id}>
              <div>
                <span
                  className={`role-badge role-${user.role}`}
                >
                  {user.roleLabel}
                </span>

                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>

              <button
                className="button button-primary"
                type="button"
                disabled={isDisabled}
                onClick={() => void login(user.email)}
              >
                {isLoading
                  ? "Logging in..."
                  : `Continue as ${user.name}`}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}