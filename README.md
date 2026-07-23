# ElevateBox Document Approval System

Hey there! This is my submission for the ElevateBox Software Engineering Challenge—a fully functional document approval and publishing workflow app built with a strong focus on security, data integrity, and correctness.

I put this together to handle the full lifecycle of a document, making sure all authorization checks, state transitions, and concurrency safeguards happen solidly on the backend.

## What it Does

* **Seeded Login:** Quickly switch between pre-set roles (Author, Reviewer, Admin, Viewer) without messing with registration flows.
* **Strict Role Permissions:** Users can only perform actions allowed by their role and document ownership (e.g., authors can't approve their own work, and viewers can only read published stuff).
* **Document Workflow:** Manages documents smoothly through Draft, Submitted, Approved, Rejected, Published, and Archived states with complete server-side validation.
* **Mandatory Rejection Feedback:** Reviewers are required to leave a comment whenever they reject a submission.
* **Audit Logging:** Every single action leaves an immutable, timestamped trail attached to the document.
* **Concurrency Control:** Leverages version checks to prevent race conditions or stale updates from overwriting someone else's work (returning a clean 409 conflict if things get out of sync).

## Tech Stack

* **Next.js** (App Router)
* **TypeScript** for type safety
* **Prisma** with SQLite for data persistence
* **Zod** for robust input validation
* **Vitest** for automated unit testing

## Roles & Permissions Breakdown

### Author

* Create new documents from scratch.
* Edit their own drafts or documents that were sent back as rejected.
* Submit drafts for review.
* Reopen rejected documents to fix and resubmit.

### Reviewer

* Review submitted documents in the queue.
* Approve submissions or reject them (with a required comment).

### Admin

* Access all documents across the board.
* Push approved documents live to published status.
* Archive active or published documents when needed.

### Viewer

* Read-only access restricted strictly to published documents.

## The Workflow State Machine

draft → submitted → approved → published
                  ↘ rejected → draft

draft / submitted / approved / published → archived