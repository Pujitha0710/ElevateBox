import {
  DocumentStatus,
  Role,
} from "@prisma/client";
import Link from "next/link";
import { connection } from "next/server";

import DocumentTable from "@/components/DocumentTable";
import Header from "@/components/Header";
import { requirePageUser } from "@/lib/auth";
import { listVisibleDocuments } from "@/lib/document-service";
import { ROLE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getDashboardDescription(
  role: Role,
): string {
  switch (role) {
    case Role.author:
      return "Create, edit and submit your documents for review.";

    case Role.reviewer:
      return "Review submitted documents and publish approved work.";

    case Role.admin:
      return "View the complete workflow and archive documents.";

    case Role.viewer:
      return "View documents that completed the approval workflow.";

    default:
      return "View available documents.";
  }
}

export default async function DocumentsPage() {
  await connection();

  const user = await requirePageUser();
  const documents =
    await listVisibleDocuments(user);

  const activeDocuments = documents.filter(
    (document) =>
      document.status !== DocumentStatus.archived,
  );

  const archivedDocuments = documents.filter(
    (document) =>
      document.status === DocumentStatus.archived,
  );

  return (
    <>
      <Header user={user} />

      <main>
        <section className="page-heading heading-with-action">
          <div>
            <p className="eyebrow">
              {ROLE_LABELS[user.role]} dashboard
            </p>

            <h1>Documents</h1>

            <p>
              {getDashboardDescription(user.role)}
            </p>
          </div>

          {user.role === Role.author ? (
            <Link
              className="button button-primary"
              href="/documents/new"
            >
              Create document
            </Link>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Active documents</h2>
              <p>
                Documents currently available to your
                account.
              </p>
            </div>

            <span className="count-badge">
              {activeDocuments.length}
            </span>
          </div>

          <DocumentTable
            documents={activeDocuments}
            emptyMessage="There are no active documents available for this account."
          />
        </section>

        {archivedDocuments.length > 0 ? (
          <section className="panel panel-spaced">
            <div className="section-heading">
              <div>
                <h2>Archived documents</h2>
                <p>
                  These documents are preserved but no
                  longer participate in the active
                  workflow.
                </p>
              </div>

              <span className="count-badge">
                {archivedDocuments.length}
              </span>
            </div>

            <DocumentTable
              documents={archivedDocuments}
              emptyMessage="There are no archived documents."
            />
          </section>
        ) : null}
      </main>
    </>
  );
}