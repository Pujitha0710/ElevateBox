# ElevateBox Document Approval System

This is my submission for the ElevateBox Software Engineering Challenge—a full-stack document approval and publishing system built with a strong focus on correctness, security, and data integrity.

The application manages the complete lifecycle of a document. Authentication, permissions, state transitions, audit logging, and concurrency checks are enforced on the server rather than relying only on the user interface.

## What It Does

### Seeded Login

Users can quickly log in as one of the predefined accounts without going through signup, password reset, or email verification flows.

The available roles are:

- Author
- Reviewer
- Admin
- Viewer

### Role-Based Permissions

Every action is checked against the logged-in user's role, the document owner, and the document's current status.

For example:

- Authors can edit only their own documents.
- Reviewers cannot approve or reject their own documents.
- Viewers can access only published documents.
- Only admins can archive documents.

These restrictions are enforced by the backend, even when an API endpoint is called directly.

### Document Workflow

Documents move through a controlled approval workflow:

```text
draft → submitted → approved → published
             ↓
          rejected → draft
```

An admin can archive documents from the following states:

```text
draft → archived
submitted → archived
approved → archived
published → archived
```

Any transition that is not part of this workflow is rejected by the server.

### Required Rejection Feedback

A reviewer must provide a comment when rejecting a document. Empty rejection comments are rejected during validation.

### Audit History

Every important document action is recorded:

- Created
- Edited
- Submitted
- Approved
- Rejected
- Reopened
- Published
- Archived

Each audit event includes:

- The user who performed the action
- The action performed
- The date and time
- Previous and new document status
- Rejection comments where applicable
- Document version information

Document changes and their matching audit events are saved inside the same database transaction.

### Concurrency Protection

Each document has a version number.

Whenever a user edits or changes the status of a document, the request includes the version they originally opened. If another user has already updated the document, the stale request is rejected with an HTTP `409 Conflict`.

Example:

1. Bob and Carol both open version `3`.
2. Bob approves the document, creating version `4`.
3. Carol tries to reject it using version `3`.
4. Carol's request is rejected.
5. Bob's approval remains unchanged.

This prevents stale pages from silently overwriting newer data.

## Tech Stack

- Next.js with App Router
- TypeScript
- Prisma ORM
- SQLite
- Zod
- Vitest
- Plain CSS

## Roles and Permissions

### Author

An author can:

- Create new draft documents
- View their own documents
- Edit their own draft or rejected documents
- Submit drafts for review
- Reopen rejected documents
- Correct and resubmit rejected documents

An author cannot:

- Edit another author's document
- Edit submitted, approved, published, or archived documents
- Approve or reject documents

### Reviewer

A reviewer can:

- View documents submitted for review
- Approve submitted documents
- Reject submitted documents with a required comment
- Publish approved documents
- View the history of accessible documents

A reviewer cannot:

- Review their own document
- Edit document content
- Approve or reject a document that is not submitted
- Archive documents

### Admin

An admin can:

- View all documents
- Publish approved documents
- Archive draft, submitted, approved, or published documents
- View complete audit histories

### Viewer

A viewer has read-only access to published documents.

Viewers cannot access private workflow documents through the interface, a direct URL, or an API request.

## Local Setup

### Prerequisites

Make sure the following are installed:

- Node.js 20.9 or newer
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Pujitha0710/ElevateBox.git
cd ElevateBox
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
DATABASE_URL="file:./dev.db"
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Apply database migrations

```bash
npx prisma migrate deploy
```

### 6. Seed the database

```bash
npm run db:seed
```

### 7. Start the application

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

## Seeded Accounts

No passwords are required. Select an account from the login page.

| Name | Email | Role |
|---|---|---|
| Alice Author | alice@example.com | Author |
| Diana Author | diana@example.com | Author |
| Bob Reviewer | bob@example.com | Reviewer |
| Carol Reviewer | carol@example.com | Reviewer |
| Admin User | admin@example.com | Admin |
| Victor Viewer | viewer@example.com | Viewer |

The second author helps demonstrate ownership restrictions, while the second reviewer helps test concurrent updates.

## Available Commands

```bash
npm run dev
npm run build
npm run lint
npm test
npm run db:generate
npm run db:seed
npm run db:verify
npm run db:studio
```

## Testing

Run the automated tests with:

```bash
npm test
```

The tests cover:

- Valid workflow transitions
- Invalid workflow transitions
- Archive transitions
- Transition action mappings
- Required title and body fields
- Required rejection comments
- Invalid document versions

Before submission, the application was also manually tested for:

- Author ownership restrictions
- Reviewer approval and rejection
- Viewer access restrictions
- Admin archival
- Audit-history creation
- Stale concurrent updates
- Invalid direct API requests

## Final Verification

Run the following commands before starting the application:

```bash
npm run lint
npm test
npm run build
```

All commands should complete successfully.

## Design Notes

Detailed technical decisions are available in:

```text
DESIGN.md
```

It explains:

- System invariants
- Authentication and authorization
- Database and application-level rules
- Workflow enforcement
- Transaction handling
- Audit consistency
- Optimistic concurrency control
- Failure cases
- Production improvements

## Current Limitations

- Authentication uses seeded development accounts.
- SQLite is used for simple local evaluation.
- Documents support plain-text content.
- Signup, OAuth, email delivery, password reset, and file uploads are not included.
- The interface prioritizes workflow clarity over advanced visual styling.
- Production deployment is outside the scope of this challenge.

## Repository

```text
https://github.com/Pujitha0710/ElevateBox
```
