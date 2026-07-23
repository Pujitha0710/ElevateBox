import { Role } from "@prisma/client";
import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";
import type { CurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";

type HeaderProps = {
  user: CurrentUser;
};

export default function Header({ user }: HeaderProps) {
  const canReview =
    user.role === Role.reviewer ||
    user.role === Role.admin;

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link className="brand" href="/documents">
          ElevateBox Approval
        </Link>

        <nav
          className="header-nav"
          aria-label="Main navigation"
        >
          <Link href="/documents">
            Documents
          </Link>

          {user.role === Role.author ? (
            <Link href="/documents/new">
              New Document
            </Link>
          ) : null}

          {canReview ? (
            <Link href="/review">
              Review Queue
            </Link>
          ) : null}

          <Link href="/published">
            Published
          </Link>
        </nav>

        <div className="current-user">
          <div>
            <strong>{user.name}</strong>

            <span>
              {ROLE_LABELS[user.role]} · {user.email}
            </span>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}