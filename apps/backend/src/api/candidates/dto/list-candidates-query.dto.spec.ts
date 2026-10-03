import { parseListCandidatesQuery } from "@ciee-curriculos/shared";
import { describe, expect, it } from "vitest";

import { ListCandidatesQueryDto } from "./list-candidates-query.dto.js";

describe("candidate list query", () => {
  it("applies default sorting", () => {
    expect(ListCandidatesQueryDto.schema.parse({})).toStrictEqual({
      hasCurriculum: "all",
      page: 1,
      pageSize: 10,
      sortBy: "id",
      sortOrder: "desc",
    });
  });

  it("trims the shared search term", () => {
    expect(ListCandidatesQueryDto.schema.parse({ q: "  ana  " }).q).toBe("ana");
  });

  it("coerces pagination and normalizes filters for URL query strings", () => {
    expect(
      ListCandidatesQueryDto.schema.parse({
        hasCurriculum: "yes",
        interestArea: "  Design  ",
        page: "2",
        pageSize: "25",
      })
    ).toStrictEqual({
      hasCurriculum: "yes",
      interestArea: "Design",
      page: 2,
      pageSize: 25,
      sortBy: "id",
      sortOrder: "desc",
    });
  });

  it("falls back to safe defaults for invalid pasted URLs", () => {
    expect(
      parseListCandidatesQuery({ page: "invalid", q: "ana" })
    ).toStrictEqual(ListCandidatesQueryDto.schema.parse({}));
  });

  it.each([
    { sortBy: "password" },
    { sortOrder: "newest" },
    { q: "a".repeat(201) },
    { page: "0" },
    { pageSize: "101" },
    { hasCurriculum: "maybe" },
  ])("rejects unsupported query values: %o", (query) => {
    expect(ListCandidatesQueryDto.schema.safeParse(query).success).toBeFalsy();
  });
});
