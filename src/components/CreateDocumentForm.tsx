"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
  message?: string;
  document?: {
    id: string;
  };
};

export default function CreateDocumentForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] =
    useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    if (!title.trim() || !body.trim()) {
      setError(
        "Both title and document body are required.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
          }),
        },
      );

      const responseBody = (await response
        .json()
        .catch(() => null)) as ApiResponse | null;

      if (
        !response.ok ||
        !responseBody?.document?.id
      ) {
        throw new Error(
          responseBody?.message ??
            "Unable to create the document.",
        );
      }

      router.push(
        `/documents/${responseBody.document.id}`,
      );
      router.refresh();
    } catch (submissionError: unknown) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create the document.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="document-form"
      onSubmit={(event) =>
        void handleSubmit(event)
      }
    >
      {error ? (
        <div
          className="alert alert-error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="form-field">
        <label htmlFor="title">Title</label>

        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          value={title}
          disabled={isSubmitting}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Enter a clear document title"
          autoFocus
          required
        />

        <span className="field-help">
          Maximum 200 characters.
        </span>
      </div>

      <div className="form-field">
        <label htmlFor="body">
          Document body
        </label>

        <textarea
          id="body"
          name="body"
          rows={16}
          maxLength={100_000}
          value={body}
          disabled={isSubmitting}
          onChange={(event) =>
            setBody(event.target.value)
          }
          placeholder="Enter the document contents"
          required
        />

        <span className="field-help">
          Plain text is sufficient for this challenge.
        </span>
      </div>

      <div className="form-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Creating..."
            : "Create draft"}
        </button>

        <button
          className="button button-secondary"
          type="button"
          disabled={isSubmitting}
          onClick={() => router.push("/documents")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}