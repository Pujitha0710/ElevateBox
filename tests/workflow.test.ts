import { DocumentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  getTargetStatus,
  isValidTransition,
} from "../src/lib/workflow";

describe("document workflow", () => {
  it("allows every required workflow transition", () => {
    expect(
      isValidTransition(
        DocumentStatus.draft,
        DocumentStatus.submitted,
      ),
    ).toBe(true);

    expect(
      isValidTransition(
        DocumentStatus.submitted,
        DocumentStatus.approved,
      ),
    ).toBe(true);

    expect(
      isValidTransition(
        DocumentStatus.submitted,
        DocumentStatus.rejected,
      ),
    ).toBe(true);

    expect(
      isValidTransition(
        DocumentStatus.rejected,
        DocumentStatus.draft,
      ),
    ).toBe(true);

    expect(
      isValidTransition(
        DocumentStatus.approved,
        DocumentStatus.published,
      ),
    ).toBe(true);
  });

  it("allows administrators to archive supported states", () => {
    const archivableStatuses = [
      DocumentStatus.draft,
      DocumentStatus.submitted,
      DocumentStatus.approved,
      DocumentStatus.published,
    ];

    for (const status of archivableStatuses) {
      expect(
        isValidTransition(
          status,
          DocumentStatus.archived,
        ),
      ).toBe(true);
    }
  });

  it("rejects invalid state transitions", () => {
    expect(
      isValidTransition(
        DocumentStatus.draft,
        DocumentStatus.published,
      ),
    ).toBe(false);

    expect(
      isValidTransition(
        DocumentStatus.submitted,
        DocumentStatus.published,
      ),
    ).toBe(false);

    expect(
      isValidTransition(
        DocumentStatus.published,
        DocumentStatus.draft,
      ),
    ).toBe(false);

    expect(
      isValidTransition(
        DocumentStatus.archived,
        DocumentStatus.draft,
      ),
    ).toBe(false);
  });

  it("maps actions to the correct target statuses", () => {
    expect(getTargetStatus("submit")).toBe(
      DocumentStatus.submitted,
    );

    expect(getTargetStatus("approve")).toBe(
      DocumentStatus.approved,
    );

    expect(getTargetStatus("reject")).toBe(
      DocumentStatus.rejected,
    );

    expect(getTargetStatus("reopen")).toBe(
      DocumentStatus.draft,
    );

    expect(getTargetStatus("publish")).toBe(
      DocumentStatus.published,
    );

    expect(getTargetStatus("archive")).toBe(
      DocumentStatus.archived,
    );
  });
});