import Link from "next/link";

import StatusBadge from "@/components/StatusBadge";
import type { DocumentSummary } from "@/lib/document-service";
import { formatDateTime } from "@/lib/format";

type DocumentTableProps = {
  documents: DocumentSummary[];
  emptyMessage: string;
};

export default function DocumentTable({
  documents,
  emptyMessage,
}: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <h3>No documents found</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="document-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Author</th>
            <th>Status</th>
            <th>Version</th>
            <th>Updated</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <Link
                  className="document-link"
                  href={`/documents/${document.id}`}
                >
                  {document.title}
                </Link>
              </td>

              <td>{document.author.name}</td>

              <td>
                <StatusBadge status={document.status} />
              </td>

              <td>{document.version}</td>

              <td>
                {formatDateTime(document.updatedAt)}
              </td>

              <td>
                <Link
                  className="text-link"
                  href={`/documents/${document.id}`}
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}