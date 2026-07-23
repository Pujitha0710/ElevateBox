import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import CreateDocumentForm from "@/components/CreateDocumentForm";
import Header from "@/components/Header";
import { requirePageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const user = await requirePageUser();

  if (user.role !== Role.author) {
    redirect("/documents");
  }

  return (
    <>
      <Header user={user} />

      <main className="narrow-main">
        <section className="page-heading">
          <p className="eyebrow">
            Author workspace
          </p>

          <h1>Create a draft</h1>

          <p>
            The document will begin in the draft
            state and will not be visible to viewers.
          </p>
        </section>

        <section className="panel">
          <CreateDocumentForm />
        </section>
      </main>
    </>
  );
}