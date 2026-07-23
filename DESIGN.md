# Design & Architecture Document - ElevateBox Approval System

## 1. Overview
The ElevateBox Document Approval System is a role-based workflow manager built with Next.js App Router, TypeScript, Prisma, and SQLite. It guarantees backend-enforced permissions, transactional audit logs, and strict optimistic concurrency control.

## 2. Architecture & Core Components

### Workflow & State Machine (`src/lib/workflow.ts`)
All valid document states and transitions are centralized in a deterministic state machine:
- `draft` → `submitted`, `archived`
- `submitted` → `approved`, `rejected`, `archived`
- `approved` → `published`, `archived`
- `rejected` → `draft`
- `published` → `archived`
- `archived` → (Terminal state)

### Permissions & Authorization (`src/lib/permissions.ts`)
Security checks are strictly evaluated on the server:
- **Authors** can create documents, edit drafts/rejected docs, submit, and reopen.
- **Reviewers** view submissions, approve, or reject (with mandatory comments).
- **Admins** manage archiving and publishing.
- **Viewers** have read-only access to published content.

### Database Transactions & Audit Logs
Every state transition is wrapped in an atomic Prisma transaction (`prisma.$transaction`). This ensures that the document status update and the corresponding immutable audit log entry either succeed together or fail completely, preventing split-brain audit histories.

### Optimistic Concurrency Control
To prevent race conditions (e.g., two reviewers editing or approving simultaneously), each document features a version integer. When a mutation is requested, the server verifies the incoming version against the database record. If a mismatch occurs, the server responds with a `409 Conflict`, forcing the client to pull the latest version.