import { NextResponse } from "next/server";

import { AppError } from "@/lib/app-error";
import { requireApiUser } from "@/lib/auth";
import {
  createDocument,
  listVisibleDocuments,
} from "@/lib/document-service";
import { createDocumentSchema } from "@/lib/document-validation";
import { handleApiError } from "@/lib/handle-api-error";
import { readJsonBody } from "@/lib/read-json-body";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireApiUser();
    const documents = await listVisibleDocuments(user);

    return NextResponse.json(
      {
        documents,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(
      error,
      "Unable to list documents",
    );
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    const user = await requireApiUser();
    const requestBody = await readJsonBody(request);

    const parsed =
      createDocumentSchema.safeParse(requestBody);

    if (!parsed.success) {
      throw new AppError(
        400,
        "BAD_REQUEST",
        "Invalid document data.",
        parsed.error.flatten(),
      );
    }

    const document = await createDocument(
      user,
      parsed.data,
    );

    return NextResponse.json(
      {
        message:
          "Draft document created successfully.",
        document,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(
      error,
      "Unable to create document",
    );
  }
}