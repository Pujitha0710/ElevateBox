import { AuditAction, DocumentStatus, Prisma, Role } from "@prisma/client";

import { AppError } from "@/lib/app-error";
import type { CurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type {
  CreateDocumentInput,
  TransitionDocumentInput,
  UpdateDocumentInput,
} from "@/lib/document-validation";
import {
  canAttemptTransition,
  canCreateDocument,
  canViewDocument,
  getDocumentVisibilityWhere,
} from "@/lib/permissions";
import {
  getTargetStatus,
  isValidTransition,
  TRANSITION_AUDIT_ACTIONS,
} from "@/lib/workflow";

const authorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const documentSummarySelect = {
  id: true,
  title: true,
  status: true,
  version: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: authorSelect,
  },
} satisfies Prisma.DocumentSelect;

const documentDetailSelect = {
  id: true,
  title: true,
  body: true,
  status: true,
  version: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: authorSelect,
  },
} satisfies Prisma.DocumentSelect;

const auditEventSelect = {
  id: true,
  action: true,
  previousStatus: true,
  newStatus: true,
  comment: true,
  metadata: true,
  createdAt: true,
  actor: {
    select: authorSelect,
  },
} satisfies Prisma.AuditEventSelect;

export type DocumentSummary = Prisma.DocumentGetPayload<{
  select: typeof documentSummarySelect;
}>;

export type DocumentDetail = Prisma.DocumentGetPayload<{
  select: typeof documentDetailSelect;
}>;

export type DocumentAuditEvent = Prisma.AuditEventGetPayload<{
  select: typeof auditEventSelect;
}>;

async function throwStaleVersionError(
  transaction: Prisma.TransactionClient,
  documentId: string,
): Promise<never> {
  const latestDocument = await transaction.document.findUnique({
    where: {
      id: documentId,
    },
    select: {
      version: true,
      status: true,
    },
  });

  if (!latestDocument) {
    throw new AppError(404, "NOT_FOUND", "Document not found.");
  }

  throw new AppError(
    409,
    "STALE_VERSION",
    "This document was changed by another user. Refresh and try again.",
    {
      currentVersion: latestDocument.version,
      currentStatus: latestDocument.status,
    },
  );
}

function assertTransitionActorPermission(
  user: CurrentUser,
  document: {
    authorId: string;
    status: DocumentStatus;
  },
  action: TransitionDocumentInput["action"],
): void {
  if (
    user.role === Role.reviewer &&
    document.authorId === user.id &&
    (action === "approve" || action === "reject" || action === "publish")
  ) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "A reviewer cannot review or publish their own document.",
    );
  }

  if (!canAttemptTransition(user, document, action)) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
}

export async function listVisibleDocuments(
  user: CurrentUser,
): Promise<DocumentSummary[]> {
  return db.document.findMany({
    where: getDocumentVisibilityWhere(user),
    select: documentSummarySelect,
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getVisibleDocument(
  user: CurrentUser,
  documentId: string,
): Promise<DocumentDetail> {
  const document = await db.document.findUnique({
    where: {
      id: documentId,
    },
    select: documentDetailSelect,
  });

  if (!document || !canViewDocument(user, document)) {
    throw new AppError(404, "NOT_FOUND", "Document not found.");
  }

  return document;
}

export async function createDocument(
  user: CurrentUser,
  input: CreateDocumentInput,
): Promise<DocumentDetail> {
  if (!canCreateDocument(user)) {
    throw new AppError(403, "FORBIDDEN", "Only authors can create documents.");
  }

  return db.$transaction(async (transaction) => {
    const document = await transaction.document.create({
      data: {
        title: input.title,
        body: input.body,
        authorId: user.id,
        status: DocumentStatus.draft,
        version: 1,
      },
      select: documentDetailSelect,
    });

    await transaction.auditEvent.create({
      data: {
        documentId: document.id,
        actorId: user.id,
        action: AuditAction.created,
        previousStatus: null,
        newStatus: DocumentStatus.draft,
        metadata: {
          version: document.version,
        },
      },
    });

    return document;
  });
}

export async function updateDocument(
  user: CurrentUser,
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentDetail> {
  return db.$transaction(async (transaction) => {
    const currentDocument = await transaction.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        authorId: true,
        status: true,
        version: true,
      },
    });

    if (!currentDocument) {
      throw new AppError(404, "NOT_FOUND", "Document not found.");
    }

    if (user.role !== Role.author || currentDocument.authorId !== user.id) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You can edit only your own documents.",
      );
    }

    if (currentDocument.version !== input.expectedVersion) {
      await throwStaleVersionError(transaction, documentId);
    }

    if (
      currentDocument.status !== DocumentStatus.draft &&
      currentDocument.status !== DocumentStatus.rejected
    ) {
      throw new AppError(
        409,
        "CONFLICT",
        "Only draft or rejected documents can be edited.",
        {
          currentStatus: currentDocument.status,
        },
      );
    }

    const updateResult = await transaction.document.updateMany({
      where: {
        id: documentId,
        authorId: user.id,
        status: currentDocument.status,
        version: input.expectedVersion,
      },
      data: {
        title: input.title,
        body: input.body,
        version: {
          increment: 1,
        },
      },
    });

    if (updateResult.count !== 1) {
      await throwStaleVersionError(transaction, documentId);
    }

    const nextVersion = input.expectedVersion + 1;

    await transaction.auditEvent.create({
      data: {
        documentId,
        actorId: user.id,
        action: AuditAction.edited,
        previousStatus: currentDocument.status,
        newStatus: currentDocument.status,
        metadata: {
          previousVersion: input.expectedVersion,
          newVersion: nextVersion,
        },
      },
    });

    const updatedDocument = await transaction.document.findUnique({
      where: {
        id: documentId,
      },
      select: documentDetailSelect,
    });

    if (!updatedDocument) {
      throw new AppError(404, "NOT_FOUND", "Document not found after update.");
    }

    return updatedDocument;
  });
}

export async function transitionDocument(
  user: CurrentUser,
  documentId: string,
  input: TransitionDocumentInput,
): Promise<DocumentDetail> {
  return db.$transaction(async (transaction) => {
    const currentDocument = await transaction.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        authorId: true,
        status: true,
        version: true,
      },
    });

    if (!currentDocument) {
      throw new AppError(404, "NOT_FOUND", "Document not found.");
    }

    assertTransitionActorPermission(user, currentDocument, input.action);

    if (currentDocument.version !== input.expectedVersion) {
      await throwStaleVersionError(transaction, documentId);
    }

    const targetStatus = getTargetStatus(input.action);

    if (!isValidTransition(currentDocument.status, targetStatus)) {
      throw new AppError(
        409,
        "INVALID_TRANSITION",
        `A document cannot move from ${currentDocument.status} to ${targetStatus}.`,
        {
          currentStatus: currentDocument.status,
          requestedStatus: targetStatus,
        },
      );
    }

    const updateResult = await transaction.document.updateMany({
      where: {
        id: documentId,
        version: input.expectedVersion,
        status: currentDocument.status,
      },
      data: {
        status: targetStatus,
        version: {
          increment: 1,
        },
      },
    });

    if (updateResult.count !== 1) {
      await throwStaleVersionError(transaction, documentId);
    }

    const nextVersion = input.expectedVersion + 1;

    await transaction.auditEvent.create({
      data: {
        documentId,
        actorId: user.id,
        action: TRANSITION_AUDIT_ACTIONS[input.action],
        previousStatus: currentDocument.status,
        newStatus: targetStatus,
        comment: input.action === "reject" ? input.comment : null,
        metadata: {
          previousVersion: input.expectedVersion,
          newVersion: nextVersion,
        },
      },
    });

    const updatedDocument = await transaction.document.findUnique({
      where: {
        id: documentId,
      },
      select: documentDetailSelect,
    });

    if (!updatedDocument) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "Document not found after transition.",
      );
    }

    return updatedDocument;
  });
}

export async function getDocumentHistory(
  user: CurrentUser,
  documentId: string,
): Promise<DocumentAuditEvent[]> {
  const document = await db.document.findUnique({
    where: {
      id: documentId,
    },
    select: {
      id: true,
      authorId: true,
      status: true,
    },
  });

  if (!document || !canViewDocument(user, document)) {
    throw new AppError(404, "NOT_FOUND", "Document not found.");
  }

  return db.auditEvent.findMany({
    where: {
      documentId,
    },
    select: auditEventSelect,
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}
