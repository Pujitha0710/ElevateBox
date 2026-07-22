import { NextResponse } from "next/server";

import { AppError } from "@/lib/app-error";
import { requireApiUser } from "@/lib/auth";
import { transitionDocument } from "@/lib/document-service";
import { transitionDocumentSchema } from "@/lib/document-validation";
import { handleApiError } from "@/lib/handle-api-error";
import { readJsonBody } from "@/lib/read-json-body";

type TransitionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: TransitionRouteContext,
): Promise<NextResponse> {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const documentId = id.trim();

    if (!documentId) {
      throw new AppError(400, "BAD_REQUEST", "Document ID is required.");
    }

    const requestBody = await readJsonBody(request);

    const parsed = transitionDocumentSchema.safeParse(requestBody);

    if (!parsed.success) {
      throw new AppError(
        400,
        "BAD_REQUEST",
        "Invalid transition request.",
        parsed.error.flatten(),
      );
    }

    const document = await transitionDocument(user, documentId, parsed.data);

    return NextResponse.json(
      {
        message: "Document state changed successfully.",
        document,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "Unable to transition document");
  }
}
