import { NextResponse } from "next/server";

import { endCurrentSession } from "@/lib/auth";
import { apiError, getErrorMessage } from "@/lib/api-response";

export async function POST(): Promise<NextResponse> {
  try {
    await endCurrentSession();

    return NextResponse.json(
      {
        message: "Logout successful.",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Logout failed:", error);

    return apiError(500, "INTERNAL_ERROR", getErrorMessage(error));
  }
}
