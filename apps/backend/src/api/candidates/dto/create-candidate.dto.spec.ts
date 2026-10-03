import { describe, expect, it } from "vitest";

import { CreateCandidateDto } from "./create-candidate.dto.js";

describe("candidate creation input", () => {
  it("normalizes email casing and international phone formatting", () => {
    const candidate = CreateCandidateDto.schema.parse({
      email: " ANA@Example.COM ",
      fullName: "Ana Souza",
      phone: "+55 (41) 99742-9889",
    });
    expect(candidate.email).toBe("ana@example.com");
    expect(candidate.phone).toBe("+5541997429889");
  });

  it("preserves local numbers without guessing the country code", () => {
    const candidate = CreateCandidateDto.schema.parse({
      email: "ana@example.com",
      fullName: "Ana Souza",
      phone: "(41) 99742-9889",
    });
    expect(candidate.phone).toBe("41997429889");
  });

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
    { email: "ana@example.com", fullName: "Ana", phone: "abc41997429889" },
    { email: "ana@example.com", fullName: "Ana", phone: "123" },
  ])("rejects invalid input: %o", (input) => {
    expect(CreateCandidateDto.schema.safeParse(input).success).toBeFalsy();
  });
});
