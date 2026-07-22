import { z } from "zod";

const documentTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(200, "Title cannot exceed 200 characters.");

const documentBodySchema = z
  .string()
  .trim()
  .min(1, "Document body is required.")
  .max(100_000, "Document body cannot exceed 100,000 characters.");

const expectedVersionSchema = z
  .number()
  .int("Expected version must be an integer.")
  .positive("Expected version must be positive.");

export const createDocumentSchema = z.object({
  title: documentTitleSchema,
  body: documentBodySchema,
});

export const updateDocumentSchema = z.object({
  title: documentTitleSchema,
  body: documentBodySchema,
  expectedVersion: expectedVersionSchema,
});

export const transitionDocumentSchema = z
  .object({
    action: z.enum([
      "submit",
      "approve",
      "reject",
      "reopen",
      "publish",
      "archive",
    ]),
    expectedVersion: expectedVersionSchema,
    comment: z
      .string()
      .trim()
      .max(2_000, "Comment cannot exceed 2,000 characters.")
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.action === "reject" && !value.comment) {
      context.addIssue({
        code: "custom",
        path: ["comment"],
        message: "A rejection comment is required.",
      });
    }
  });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export type TransitionDocumentInput = z.infer<typeof transitionDocumentSchema>;
