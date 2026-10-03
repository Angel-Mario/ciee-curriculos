import { describe, expect, it } from "vitest";

import { ListCandidatesQueryDto } from "./list-candidates-query.dto.js";

describe("candidate list query", () => {
  it("applies default sorting", () => {
    expect(ListCandidatesQueryDto.schema.parse({})).toStrictEqual({
      sortBy: "id",
      sortOrder: "desc",
    });
  });

  it("trims the shared search term", () => {
    expect(ListCandidatesQueryDto.schema.parse({ q: "  ana  " }).q).toBe("ana");
  });

  it.each([
    { sortBy: "password" },
    { sortOrder: "newest" },
    { q: "a".repeat(201) },
    { page: "2" },
  ])("rejects unsupported query values: %o", (query) => {
    expect(ListCandidatesQueryDto.schema.safeParse(query).success).toBeFalsy();
  });
});
