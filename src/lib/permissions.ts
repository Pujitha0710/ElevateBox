import { DocumentStatus, Prisma, Role } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth";
import {
  getTargetStatus,
  isValidTransition,
  type TransitionAction,
} from "@/lib/workflow";

export type DocumentPermissionTarget = {
  authorId: string;
  status: DocumentStatus;
};

const reviewerVisibleStatuses: DocumentStatus[] = [
  DocumentStatus.submitted,
  DocumentStatus.approved,
  DocumentStatus.published,
];

export function canCreateDocument(user: CurrentUser): boolean {
  return user.role === Role.author;
}

export function getDocumentVisibilityWhere(
  user: CurrentUser,
): Prisma.DocumentWhereInput {
  switch (user.role) {
    case Role.admin:
      return {};

    case Role.author:
      return {
        OR: [
          {
            authorId: user.id,
          },
          {
            status: DocumentStatus.published,
          },
        ],
      };

    case Role.reviewer:
      return {
        status: {
          in: reviewerVisibleStatuses,
        },
      };

    case Role.viewer:
      return {
        status: DocumentStatus.published,
      };

    default:
      return {
        id: "__no_document__",
      };
  }
}

export function canViewDocument(
  user: CurrentUser,
  document: DocumentPermissionTarget,
): boolean {
  switch (user.role) {
    case Role.admin:
      return true;

    case Role.author:
      return (
        document.authorId === user.id ||
        document.status === DocumentStatus.published
      );

    case Role.reviewer:
      return reviewerVisibleStatuses.includes(document.status);

    case Role.viewer:
      return document.status === DocumentStatus.published;

    default:
      return false;
  }
}

export function canEditDocument(
  user: CurrentUser,
  document: DocumentPermissionTarget,
): boolean {
  return (
    user.role === Role.author &&
    document.authorId === user.id &&
    (document.status === DocumentStatus.draft ||
      document.status === DocumentStatus.rejected)
  );
}

export function canAttemptTransition(
  user: CurrentUser,
  document: DocumentPermissionTarget,
  action: TransitionAction,
): boolean {
  switch (action) {
    case "submit":
    case "reopen":
      return user.role === Role.author && document.authorId === user.id;

    case "approve":
    case "reject":
      return user.role === Role.reviewer && document.authorId !== user.id;

    case "publish":
      if (user.role === Role.admin) {
        return true;
      }

      return user.role === Role.reviewer && document.authorId !== user.id;

    case "archive":
      return user.role === Role.admin;

    default:
      return false;
  }
}

export function canTransitionDocument(
  user: CurrentUser,
  document: DocumentPermissionTarget,
  action: TransitionAction,
): boolean {
  const targetStatus = getTargetStatus(action);

  return (
    canAttemptTransition(user, document, action) &&
    isValidTransition(document.status, targetStatus)
  );
}
