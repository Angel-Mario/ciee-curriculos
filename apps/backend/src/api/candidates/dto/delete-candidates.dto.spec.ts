import { describe, expect, it } from "vitest";

import { DeleteCandidatesDto } from "./delete-candidates.dto.js";

describe("bulk candidate deletion input", () => {
  it("removes duplicate IDs before the bulk delete", () => {
    expect(DeleteCandidatesDto.schema.parse({ ids: [2, 2, 7] })).toStrictEqual({
      ids: [2, 7],
    });
  });

  it.each([
    {},
    { ids: [] },
    { ids: [0] },
    { ids: [-1] },
    { ids: [1.5] },
    { ids: [2_147_483_648] },
    { ids: Array.from({ length: 101 }, (_, index) => index + 1) },
    { ids: [1], unexpected: true },
  ])("rejects invalid bulk delete input: %o", (input) => {
    expect(DeleteCandidatesDto.schema.safeParse(input).success).toBeFalsy();
  });
});
