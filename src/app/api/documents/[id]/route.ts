import { NextResponse } from "next/server";

import { AppError } from "@/lib/app-error";
import { requireApiUser } from "@/lib/auth";
import { getVisibleDocument, updateDocument } from "@/lib/document-service";
import { updateDocumentSchema } from "@/lib/document-validation";
import { handleApiError } from "@/lib/handle-api-error";
import { readJsonBody } from "@/lib/read-json-body";

type DocumentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getDocumentId(context: DocumentRouteContext): Promise<string> {
  const { id } = await context.params;
  const documentId = id.trim();

  if (!documentId) {
    throw new AppError(400, "BAD_REQUEST", "Document ID is required.");
  }

  return documentId;
}

export async function GET(
  _request: Request,
  context: DocumentRouteContext,
): Promise<NextResponse> {
  try {
    const user = await requireApiUser();
    const documentId = await getDocumentId(context);

    const document = await getVisibleDocument(user, documentId);

    return NextResponse.json(
      {
        document,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "Unable to retrieve document");
  }
}

export async function PATCH(
  request: Request,
  context: DocumentRouteContext,
): Promise<NextResponse> {
  try {
    const user = await requireApiUser();
    const documentId = await getDocumentId(context);
    const requestBody = await readJsonBody(request);

    const parsed = updateDocumentSchema.safeParse(requestBody);

    if (!parsed.success) {
      throw new AppError(
        400,
        "BAD_REQUEST",
        "Invalid document update.",
        parsed.error.flatten(),
      );
    }

    const document = await updateDocument(user, documentId, parsed.data);

    return NextResponse.json(
      {
        message: "Document updated successfully.",
        document,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "Unable to update document");
  }
}
