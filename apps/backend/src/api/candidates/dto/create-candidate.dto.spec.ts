import { describe, expect, it } from "vitest";

import { CreateCandidateDto } from "./create-candidate.dto.js";

describe("candidate creation input", () => {
  it("trims required fields and normalizes empty optional fields", () => {
    const candidate = CreateCandidateDto.schema.parse({
      email: "  ana@example.com  ",
      fullName: "  Ana Souza  ",
      interestArea: "  ",
      phone: null,
      professionalSummary: " Node.js ",
    });

    expect(candidate).toStrictEqual({
      email: "ana@example.com",
      fullName: "Ana Souza",
      interestArea: null,
      phone: null,
      professionalSummary: "Node.js",
    });
  });

  it.each([
    { email: "", fullName: "Ana" },
    { email: "not-an-email", fullName: "Ana" },
    { email: "ana@example.com", fullName: "   " },
    { email: "ana@example.com", extra: true, fullName: "Ana" },
    { email: "ana@example.com", fullName: "A".repeat(201) },
    { email: "ana@example.com", fullName: "Ana", phone: "1".repeat(33) },
  ])("rejects invalid input: %o", (input) => {
    expect(CreateCandidateDto.schema.safeParse(input).success).toBeFalsy();
  });
});
