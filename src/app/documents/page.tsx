import Header from "@/components/Header";
import { requirePageUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await requirePageUser();

  return (
    <>
      <Header user={user} />

      <main>
        <section className="page-heading">
          <p className="eyebrow">Authentication verified</p>
          <h1>Documents</h1>
          <p>
            You are logged in as{" "}
            <strong>{ROLE_LABELS[user.role]}</strong>.
          </p>
        </section>

        <section className="panel">
          <h2>Part 3 completed</h2>

          <dl className="details-list">
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>

            <div>
              <dt>Role</dt>
              <dd>{ROLE_LABELS[user.role]}</dd>
            </div>
          </dl>

          <p>
            The actual document list will be added in the next
            parts.
          </p>
        </section>
      </main>
    </>
  );
}