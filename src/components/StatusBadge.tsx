import { DocumentStatus } from "@prisma/client";

import { DOCUMENT_STATUS_LABELS } from "@/lib/labels";

type StatusBadgeProps = {
  status: DocumentStatus;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-${status}`}
    >
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  );
}