"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type TransitionAction =
  | "submit"
  | "approve"
  | "reject"
  | "reopen"
  | "publish"
  | "archive";

type DocumentActionsProps = {
  document: {
    id: string;
    title: string;
    body: string;
    status: string;
    version: number;
  };
  canEdit: boolean;
  actions: TransitionAction[];
};

type ApiResponse = {
  message?: string;
  error?: string;
  details?: {
    currentVersion?: number;
    currentStatus?: string;
  };
};

const ACTION_LABELS: Record<
  TransitionAction,
  string
> = {
  submit: "Submit for review",
  approve: "Approve",
  reject: "Reject",
  reopen: "Reopen as draft",
  publish: "Publish",
  archive: "Archive",
};

function getButtonClass(
  action: TransitionAction,
): string {
  if (
    action === "reject" ||
    action === "archive"
  ) {
    return "button button-danger";
  }

  if (
    action === "submit" ||
    action === "approve" ||
    action === "publish"
  ) {
    return "button button-primary";
  }

  return "button button-secondary";
}

export default function DocumentActions({
  document,
  canEdit,
  actions,
}: DocumentActionsProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] =
    useState(false);
  const [title, setTitle] =
    useState(document.title);
  const [body, setBody] =
    useState(document.body);
  const [showRejectForm, setShowRejectForm] =
    useState(false);
  const [rejectionComment, setRejectionComment] =
    useState("");
  const [busyAction, setBusyAction] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);
  const [hasConflict, setHasConflict] =
    useState(false);

  function resetMessages(): void {
    setError(null);
    setSuccess(null);
    setHasConflict(false);
  }

  async function readResponse(
    response: Response,
  ): Promise<ApiResponse | null> {
    return (await response
      .json()
      .catch(() => null)) as ApiResponse | null;
  }

  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (busyAction) {
      return;
    }

    resetMessages();

    if (!title.trim() || !body.trim()) {
      setError(
        "Both title and document body are required.",
      );
      return;
    }

    setBusyAction("edit");

    try {
      const response = await fetch(
        `/api/documents/${document.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            expectedVersion: document.version,
          }),
        },
      );

      const responseBody =
        await readResponse(response);

      if (!response.ok) {
        if (
          responseBody?.error ===
          "STALE_VERSION"
        ) {
          setHasConflict(true);
        }

        throw new Error(
          responseBody?.message ??
            "Unable to update the document.",
        );
      }

      setSuccess(
        responseBody?.message ??
          "Document updated successfully.",
      );
      setIsEditing(false);
      router.refresh();
    } catch (updateError: unknown) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the document.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function performTransition(
    action: TransitionAction,
  ): Promise<void> {
    if (busyAction) {
      return;
    }

    resetMessages();

    if (
      action === "reject" &&
      !rejectionComment.trim()
    ) {
      setError(
        "Enter a comment explaining why the document is being rejected.",
      );
      return;
    }

    setBusyAction(action);

    try {
      const response = await fetch(
        `/api/documents/${document.id}/transition`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            expectedVersion: document.version,
            ...(action === "reject"
              ? {
                  comment:
                    rejectionComment.trim(),
                }
              : {}),
          }),
        },
      );

      const responseBody =
        await readResponse(response);

      if (!response.ok) {
        if (
          responseBody?.error ===
          "STALE_VERSION"
        ) {
          setHasConflict(true);
        }

        throw new Error(
          responseBody?.message ??
            "Unable to change the document state.",
        );
      }

      setSuccess(
        responseBody?.message ??
          "Document state changed successfully.",
      );

      setShowRejectForm(false);
      setRejectionComment("");
      router.refresh();
    } catch (transitionError: unknown) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "Unable to change the document state.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  const directActions = actions.filter(
    (action) => action !== "reject",
  );

  const canReject =
    actions.includes("reject");

  const hasAnyControls =
    canEdit || actions.length > 0;

  if (!hasAnyControls) {
    return (
      <div className="empty-state compact-empty">
        <p>
          No actions are currently available for
          your role and this document state.
        </p>
      </div>
    );
  }

  return (
    <div className="document-controls">
      {error ? (
        <div
          className="alert alert-error"
          role="alert"
        >
          <strong>Action failed.</strong>
          <p>{error}</p>

          {hasConflict ? (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => router.refresh()}
            >
              Load latest version
            </button>
          ) : null}
        </div>
      ) : null}

      {success ? (
        <div
          className="alert alert-success"
          role="status"
        >
          {success}
        </div>
      ) : null}

      {!isEditing ? (
        <div className="workflow-actions">
          {canEdit ? (
            <button
              className="button button-secondary"
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                resetMessages();
                setIsEditing(true);
              }}
            >
              Edit document
            </button>
          ) : null}

          {directActions.map((action) => (
            <button
              className={getButtonClass(action)}
              type="button"
              key={action}
              disabled={busyAction !== null}
              onClick={() =>
                void performTransition(action)
              }
            >
              {busyAction === action
                ? "Processing..."
                : ACTION_LABELS[action]}
            </button>
          ))}

          {canReject ? (
            <button
              className="button button-danger"
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                resetMessages();
                setShowRejectForm(
                  (current) => !current,
                );
              }}
            >
              Reject
            </button>
          ) : null}
        </div>
      ) : null}

      {isEditing ? (
        <form
          className="document-form inline-form"
          onSubmit={(event) =>
            void handleEdit(event)
          }
        >
          <div className="form-field">
            <label htmlFor="edit-title">
              Title
            </label>

            <input
              id="edit-title"
              type="text"
              maxLength={200}
              value={title}
              disabled={busyAction !== null}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-body">
              Document body
            </label>

            <textarea
              id="edit-body"
              rows={14}
              maxLength={100_000}
              value={body}
              disabled={busyAction !== null}
              onChange={(event) =>
                setBody(event.target.value)
              }
              required
            />
          </div>

          <div className="form-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={busyAction !== null}
            >
              {busyAction === "edit"
                ? "Saving..."
                : "Save changes"}
            </button>

            <button
              className="button button-secondary"
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                setTitle(document.title);
                setBody(document.body);
                setIsEditing(false);
                resetMessages();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {showRejectForm ? (
        <div className="reject-form">
          <div className="form-field">
            <label htmlFor="rejection-comment">
              Rejection comment
            </label>

            <textarea
              id="rejection-comment"
              rows={5}
              maxLength={2_000}
              value={rejectionComment}
              disabled={busyAction !== null}
              onChange={(event) =>
                setRejectionComment(
                  event.target.value,
                )
              }
              placeholder="Explain what must be corrected before resubmission"
            />
          </div>

          <div className="form-actions">
            <button
              className="button button-danger"
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                void performTransition("reject")
              }
            >
              {busyAction === "reject"
                ? "Rejecting..."
                : "Confirm rejection"}
            </button>

            <button
              className="button button-secondary"
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                setShowRejectForm(false);
                setRejectionComment("");
                resetMessages();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}