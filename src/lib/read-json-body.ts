import { AppError } from "@/lib/app-error";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "The request body must contain valid JSON.",
    );
  }
}
