import StatusBadge from "@/components/StatusBadge";
import type { DocumentAuditEvent } from "@/lib/document-service";
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS } from "@/lib/labels";

type AuditTimelineProps = {
  events: DocumentAuditEvent[];
};

export default function AuditTimeline({
  events,
}: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <p>No audit events were found.</p>
      </div>
    );
  }

  return (
    <ol className="audit-timeline">
      {events.map((event) => (
        <li
          className="audit-event"
          key={event.id}
        >
          <div className="audit-marker" />

          <div className="audit-content">
            <div className="audit-heading">
              <strong>
                {AUDIT_ACTION_LABELS[event.action]}
              </strong>

              <time>
                {formatDateTime(event.createdAt)}
              </time>
            </div>

            <p>
              Performed by{" "}
              <strong>{event.actor.name}</strong>{" "}
              ({event.actor.email})
            </p>

            {event.previousStatus && event.newStatus ? (
              <div className="audit-transition">
                <StatusBadge
                  status={event.previousStatus}
                />

                <span aria-hidden="true">→</span>

                <StatusBadge
                  status={event.newStatus}
                />
              </div>
            ) : null}

            {event.comment ? (
              <blockquote className="audit-comment">
                {event.comment}
              </blockquote>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}