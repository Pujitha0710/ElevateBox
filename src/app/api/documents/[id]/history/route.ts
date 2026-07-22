import { NextResponse } from "next/server";

import { AppError } from "@/lib/app-error";
import { requireApiUser } from "@/lib/auth";
import { getDocumentHistory } from "@/lib/document-service";
import { handleApiError } from "@/lib/handle-api-error";

type HistoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: HistoryRouteContext,
): Promise<NextResponse> {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const documentId = id.trim();

    if (!documentId) {
      throw new AppError(400, "BAD_REQUEST", "Document ID is required.");
    }

    const events = await getDocumentHistory(user, documentId);

    return NextResponse.json(
      {
        events,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "Unable to retrieve document history");
  }
}
