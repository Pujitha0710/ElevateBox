import { DocumentStatus } from "@prisma/client";

import DocumentTable from "@/components/DocumentTable";
import Header from "@/components/Header";
import { requirePageUser } from "@/lib/auth";
import { listVisibleDocuments } from "@/lib/document-service";

export const dynamic = "force-dynamic";

export default async function PublishedPage() {
  const user = await requirePageUser();

  const documents =
    await listVisibleDocuments(user);

  const publishedDocuments =
    documents.filter(
      (document) =>
        document.status ===
        DocumentStatus.published,
    );

  return (
    <>
      <Header user={user} />

      <main>
        <section className="page-heading">
          <p className="eyebrow">
            Public content
          </p>

          <h1>Published documents</h1>

          <p>
            These documents completed the required
            approval workflow.
          </p>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Available documents</h2>
              <p>
                Only published documents are visible to
                viewers.
              </p>
            </div>

            <span className="count-badge">
              {publishedDocuments.length}
            </span>
          </div>

          <DocumentTable
            documents={publishedDocuments}
            emptyMessage="No documents have been published yet."
          />
        </section>
      </main>
    </>
  );
}