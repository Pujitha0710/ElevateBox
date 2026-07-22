import { NextResponse } from "next/server";

import { startSession } from "@/lib/auth";
import { loginSchema } from "@/lib/auth-validation";
import { apiError, getErrorMessage } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const requestBody: unknown = await request.json().catch(() => null);

    const parsed = loginSchema.safeParse(requestBody);

    if (!parsed.success) {
      return apiError(
        400,
        "BAD_REQUEST",
        "Invalid login request.",
        parsed.error.flatten(),
      );
    }

    const user = await db.user.findUnique({
      where: {
        email: parsed.data.email.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return apiError(
        404,
        "NOT_FOUND",
        "The selected seeded user does not exist.",
      );
    }

    await startSession(user.id);

    return NextResponse.json(
      {
        message: "Login successful.",
        user,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Login failed:", error);

    return apiError(500, "INTERNAL_ERROR", getErrorMessage(error));
  }
}
