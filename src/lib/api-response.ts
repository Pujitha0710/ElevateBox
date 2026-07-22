import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STALE_VERSION"
  | "INVALID_TRANSITION"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
  details?: unknown;
};

export function apiError(
  status: number,
  error: ApiErrorCode,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error,
      message,
      ...(details === undefined ? {} : { details }),
    },
    { status },
  );
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}