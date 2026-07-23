import {
  DocumentStatus,
  Role,
} from "@prisma/client";
import { redirect } from "next/navigation";

import DocumentTable from "@/components/DocumentTable";
import Header from "@/components/Header";
import { requirePageUser } from "@/lib/auth";
import { listVisibleDocuments } from "@/lib/document-service";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requirePageUser();

  if (
    user.role !== Role.reviewer &&
    user.role !== Role.admin
  ) {
    redirect("/documents");
  }

  const documents =
    await listVisibleDocuments(user);

  const submittedDocuments =
    documents.filter(
      (document) =>
        document.status ===
        DocumentStatus.submitted,
    );

  const approvedDocuments =
    documents.filter(
      (document) =>
        document.status ===
        DocumentStatus.approved,
    );

  return (
    <>
      <Header user={user} />

      <main>
        <section className="page-heading">
          <p className="eyebrow">
            Review workspace
          </p>

          <h1>Review queue</h1>

          <p>
            Process submitted documents and publish
            approved documents.
          </p>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Waiting for review</h2>
              <p>
                Submitted documents requiring approval
                or rejection.
              </p>
            </div>

            <span className="count-badge">
              {submittedDocuments.length}
            </span>
          </div>

          <DocumentTable
            documents={submittedDocuments}
            emptyMessage="No submitted documents are waiting for review."
          />
        </section>

        <section className="panel panel-spaced">
          <div className="section-heading">
            <div>
              <h2>Ready to publish</h2>
              <p>
                Approved documents waiting to become
                public.
              </p>
            </div>

            <span className="count-badge">
              {approvedDocuments.length}
            </span>
          </div>

          <DocumentTable
            documents={approvedDocuments}
            emptyMessage="No approved documents are waiting for publication."
          />
        </section>
      </main>
    </>
  );
}