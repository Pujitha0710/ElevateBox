import { connection } from "next/server";
import { notFound } from "next/navigation";

import AuditTimeline from "@/components/AuditTimeline";
import DocumentActions from "@/components/DocumentActions";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { AppError } from "@/lib/app-error";
import { requirePageUser } from "@/lib/auth";
import {
  getDocumentHistory,
  getVisibleDocument,
  type DocumentAuditEvent,
  type DocumentDetail,
} from "@/lib/document-service";
import { formatDateTime } from "@/lib/format";
import {
  canEditDocument,
  canTransitionDocument,
} from "@/lib/permissions";
import type { TransitionAction } from "@/lib/workflow";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const TRANSITION_ACTIONS: TransitionAction[] = [
  "submit",
  "approve",
  "reject",
  "reopen",
  "publish",
  "archive",
];

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  await connection();

  const user = await requirePageUser();
  const { id } = await params;
  const documentId = id.trim();

  if (!documentId) {
    notFound();
  }

  let document: DocumentDetail;
  let history: DocumentAuditEvent[];

  try {
    [document, history] = await Promise.all([
      getVisibleDocument(user, documentId),
      getDocumentHistory(user, documentId),
    ]);
  } catch (error: unknown) {
    if (
      error instanceof AppError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }

  const canEdit = canEditDocument(
    user,
    document,
  );

  const availableActions =
    TRANSITION_ACTIONS.filter((action) =>
      canTransitionDocument(
        user,
        document,
        action,
      ),
    );

  return (
    <>
      <Header user={user} />

      <main>
        <section className="page-heading">
          <div className="document-title-row">
            <div>
              <p className="eyebrow">
                Document details
              </p>

              <h1>{document.title}</h1>
            </div>

            <StatusBadge status={document.status} />
          </div>

          <p>
            Owned by{" "}
            <strong>{document.author.name}</strong>.
          </p>
        </section>

        <div className="detail-layout">
          <div className="detail-main">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Document content</h2>

                  <p>
                    Published content cannot be silently
                    edited.
                  </p>
                </div>
              </div>

              <article className="document-body">
                {document.body}
              </article>
            </section>

            <section className="panel panel-spaced">
              <div className="section-heading">
                <div>
                  <h2>Audit history</h2>

                  <p>
                    Chronological record of every
                    important action.
                  </p>
                </div>

                <span className="count-badge">
                  {history.length}
                </span>
              </div>

              <AuditTimeline events={history} />
            </section>
          </div>

          <aside className="detail-sidebar">
            <section className="panel">
              <h2>Workflow actions</h2>

              <p className="muted-text">
                Available actions depend on your role,
                ownership and the current document state.
              </p>

              <DocumentActions
                key={document.version}
                document={{
                  id: document.id,
                  title: document.title,
                  body: document.body,
                  status: document.status,
                  version: document.version,
                }}
                canEdit={canEdit}
                actions={availableActions}
              />
            </section>

            <section className="panel panel-spaced">
              <h2>Document information</h2>

              <dl className="details-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge
                      status={document.status}
                    />
                  </dd>
                </div>

                <div>
                  <dt>Version</dt>
                  <dd>{document.version}</dd>
                </div>

                <div>
                  <dt>Author</dt>
                  <dd>{document.author.name}</dd>
                </div>

                <div>
                  <dt>Email</dt>
                  <dd>{document.author.email}</dd>
                </div>

                <div>
                  <dt>Created</dt>
                  <dd>
                    {formatDateTime(
                      document.createdAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Updated</dt>
                  <dd>
                    {formatDateTime(
                      document.updatedAt,
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}