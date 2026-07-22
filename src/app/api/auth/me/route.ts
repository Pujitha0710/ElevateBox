import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  apiError,
  getErrorMessage,
} from "@/lib/api-response";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError(
        401,
        "UNAUTHENTICATED",
        "You must log in to continue.",
      );
    }

    return NextResponse.json(
      {
        user,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Current-user lookup failed:", error);

    return apiError(
      500,
      "INTERNAL_ERROR",
      getErrorMessage(error),
    );
  }
}