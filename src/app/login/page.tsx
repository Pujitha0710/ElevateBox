import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/documents");
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  const loginUsers = users.map((user) => ({
    ...user,
    roleLabel: ROLE_LABELS[user.role],
  }));

  return (
    <main className="login-page">
      <section className="page-heading">
        <p className="eyebrow">ElevateBox Engineering Challenge</p>
        <h1>Document Approval System</h1>
        <p>
          Select a seeded account to test its role and
          permissions.
        </p>
      </section>

      <LoginForm users={loginUsers} />

      <section className="login-note">
        <strong>Development authentication:</strong> no passwords,
        registration or external login providers are required for
        this challenge.
      </section>
    </main>
  );
}