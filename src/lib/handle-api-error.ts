import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { AppError } from "@/lib/app-error";

export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof AppError) {
    return apiError(error.status, error.code, error.message, error.details);
  }

  console.error(`${context}:`, error);

  return apiError(
    500,
    "INTERNAL_ERROR",
    "An unexpected server error occurred.",
  );
}
