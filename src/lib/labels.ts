import {
  AuditAction,
  DocumentStatus,
  Role,
} from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  [Role.viewer]: "Viewer",
  [Role.author]: "Author",
  [Role.reviewer]: "Reviewer",
  [Role.admin]: "Admin",
};

export const DOCUMENT_STATUS_LABELS: Record<
  DocumentStatus,
  string
> = {
  [DocumentStatus.draft]: "Draft",
  [DocumentStatus.submitted]: "Submitted",
  [DocumentStatus.approved]: "Approved",
  [DocumentStatus.rejected]: "Rejected",
  [DocumentStatus.published]: "Published",
  [DocumentStatus.archived]: "Archived",
};

export const AUDIT_ACTION_LABELS: Record<
  AuditAction,
  string
> = {
  [AuditAction.created]: "Created",
  [AuditAction.edited]: "Edited",
  [AuditAction.submitted]: "Submitted",
  [AuditAction.approved]: "Approved",
  [AuditAction.rejected]: "Rejected",
  [AuditAction.reopened]: "Reopened",
  [AuditAction.published]: "Published",
  [AuditAction.archived]: "Archived",
};