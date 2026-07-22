import { AuditAction, DocumentStatus } from "@prisma/client";

export const TRANSITION_TARGETS = {
  submit: DocumentStatus.submitted,
  approve: DocumentStatus.approved,
  reject: DocumentStatus.rejected,
  reopen: DocumentStatus.draft,
  publish: DocumentStatus.published,
  archive: DocumentStatus.archived,
} as const;

export type TransitionAction = keyof typeof TRANSITION_TARGETS;

export const TRANSITION_AUDIT_ACTIONS: Record<TransitionAction, AuditAction> = {
  submit: AuditAction.submitted,
  approve: AuditAction.approved,
  reject: AuditAction.rejected,
  reopen: AuditAction.reopened,
  publish: AuditAction.published,
  archive: AuditAction.archived,
};

export const VALID_TRANSITIONS: Record<
  DocumentStatus,
  readonly DocumentStatus[]
> = {
  [DocumentStatus.draft]: [DocumentStatus.submitted, DocumentStatus.archived],

  [DocumentStatus.submitted]: [
    DocumentStatus.approved,
    DocumentStatus.rejected,
    DocumentStatus.archived,
  ],

  [DocumentStatus.approved]: [
    DocumentStatus.published,
    DocumentStatus.archived,
  ],

  [DocumentStatus.rejected]: [DocumentStatus.draft],

  [DocumentStatus.published]: [DocumentStatus.archived],

  [DocumentStatus.archived]: [],
};

export function getTargetStatus(action: TransitionAction): DocumentStatus {
  return TRANSITION_TARGETS[action];
}

export function isValidTransition(
  currentStatus: DocumentStatus,
  nextStatus: DocumentStatus,
): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(nextStatus);
}
