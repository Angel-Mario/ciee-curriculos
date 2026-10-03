import { interestAreas } from "@ciee-curriculos/shared";
import { describe, expect, it } from "vitest";

import { CreateCandidateDto } from "./create-candidate.dto.js";

describe("candidate creation input", () => {
  it.each(interestAreas)(
    "accepts the predefined interest area %s",
    (interestArea) => {
      expect(
        CreateCandidateDto.schema.parse({
          email: "ana@example.com",
          fullName: "Ana Souza",
          interestArea: ` ${interestArea} `,
        }).interestArea
      ).toBe(interestArea);
    }
  );

  it.each([undefined, null, "", "   "])(
    "keeps interest area optional: %s",
    (interestArea) => {
      expect(
        CreateCandidateDto.schema.parse({
          email: "ana@example.com",
          fullName: "Ana Souza",
          interestArea,
        }).interestArea
      ).toBeNull();
    }
  );

  it.each(["Cargo inventado", "desenvolvimento backend", "Backend"])(
    "rejects unlisted interest areas: %s",
    (interestArea) => {
      const result = CreateCandidateDto.schema.safeParse({
        email: "ana@example.com",
        fullName: "Ana Souza",
        interestArea,
      });
      expect(result.success).toBeFalsy();
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          message: "Selecione uma área ou cargo da lista de opções.",
          path: ["interestArea"],
        })
      );
    }
  );

  it("normalizes email casing and international phone formatting", () => {
    const candidate = CreateCandidateDto.schema.parse({
      email: " ANA@Example.COM ",
      fullName: "Ana Souza",
      phone: "+55 (41) 99742-9889",
    });
    expect(candidate.email).toBe("ana@example.com");
    expect(candidate.phone).toBe("41997429889");
  });

  it("preserves national numbers", () => {
    const candidate = CreateCandidateDto.schema.parse({
      email: "ana@example.com",
      fullName: "Ana Souza",
      phone: "(41) 99742-9889",
    });
    expect(candidate.phone).toBe("41997429889");
  });

  it.each([
    ["+55 (41) 99742-9889", "41997429889"],
    ["55 41 99742-9889", "41997429889"],
    ["(41) 3333-4444", "4133334444"],
    ["(55) 99742-9889", "55997429889"],
    ["(55) 3333-4444", "5533334444"],
    ["+55 (55) 99742-9889", "55997429889"],
    ["", null],
    ["   ", null],
    [null, null],
    [undefined, null],
  ])("normalizes Brazilian phone %s to %s", (phone, expected) => {
    expect(
      CreateCandidateDto.schema.parse({
        email: "ana@example.com",
        fullName: "Ana",
        phone,
      }).phone
    ).toBe(expected);
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
    ...[
      "+1 212 555 1234",
      "+54 11 99999 1234",
      "(20) 99999-1234",
      "(41) 89999-1234",
      "(41) 9999-1234",
      "(41) 1234-5678",
      "(41) 33333-4444",
      "(41) 99999-12345",
      "55419999912345",
      "+55 55 41 99999-1234",
      "41999991234 ext 1",
    ].map((phone) => ({ email: "ana@example.com", fullName: "Ana", phone })),
    {
      email: "ana@example.com",
      fullName: "Ana",
      interestArea: "A".repeat(201),
    },
    {
      email: "ana@example.com",
      fullName: "Ana",
      professionalSummary: "A".repeat(2001),
    },
  ])("rejects invalid input: %o", (input) => {
    expect(CreateCandidateDto.schema.safeParse(input).success).toBeFalsy();
  });
});
