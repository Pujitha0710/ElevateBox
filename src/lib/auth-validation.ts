import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("A valid seeded-user email is required.")
    .max(320, "Email is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;