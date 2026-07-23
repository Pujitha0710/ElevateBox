import { describe, expect, it } from "vitest";

import {
  createDocumentSchema,
  transitionDocumentSchema,
  updateDocumentSchema,
} from "../src/lib/document-validation";

describe("document validation", () => {
  it("accepts valid document data", () => {
    const result = createDocumentSchema.safeParse({
      title: "Security Policy",
      body: "This is the document content.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createDocumentSchema.safeParse({
      title: "   ",
      body: "Valid body",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty document body", () => {
    const result = createDocumentSchema.safeParse({
      title: "Valid title",
      body: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("requires a comment when rejecting", () => {
    const result = transitionDocumentSchema.safeParse({
      action: "reject",
      expectedVersion: 1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts rejection with a comment", () => {
    const result = transitionDocumentSchema.safeParse({
      action: "reject",
      expectedVersion: 1,
      comment: "Please correct the final section.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid version numbers", () => {
    const result = updateDocumentSchema.safeParse({
      title: "Valid title",
      body: "Valid body",
      expectedVersion: 0,
    });

    expect(result.success).toBe(false);
  });
});