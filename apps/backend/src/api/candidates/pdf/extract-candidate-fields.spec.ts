import { describe, expect, it } from "vitest";

import { extractCandidateFields } from "./extract-candidate-fields.js";

describe("PDF contact extraction", () => {
  it("extracts labeled contact information from text", () => {
    expect(
      extractCandidateFields(
        "Nome completo: Ana Souza\nE-mail: ana@example.com\nTelefone: +55 (41) 99999-1234"
      )
    ).toStrictEqual({
      data: {
        email: "ana@example.com",
        fullName: "Ana Souza",
        phone: "+55 (41) 99999-1234",
      },
      missingFields: [],
      warnings: [],
    });
  });

  it("returns partial data and identifies fields that need manual entry", () => {
    expect(
      extractCandidateFields("Nome: Ana Souza\nana@example.com")
    ).toStrictEqual({
      data: {
        email: "ana@example.com",
        fullName: "Ana Souza",
        phone: null,
      },
      missingFields: ["phone"],
      warnings: [
        {
          code: "PARTIAL_EXTRACTION",
          message:
            "Alguns campos não foram identificados. Complete-os manualmente.",
        },
      ],
    });
  });

  it("avoids selecting an email when the document contains multiple candidates", () => {
    const result = extractCandidateFields(
      "Nome: Ana Souza\nana@example.com\nrecrutamento@example.com"
    );

    expect(result.data.email).toBeNull();
    expect(result.missingFields).toContain("email");
    expect(result.warnings[0]?.code).toBe("EMAIL_AMBIGUOUS");
  });

  it("allows manual entry when a PDF contains no extractable text", () => {
    expect(extractCandidateFields(" \n ")).toStrictEqual({
      data: { email: null, fullName: null, phone: null },
      missingFields: ["fullName", "email", "phone"],
      warnings: [
        {
          code: "NO_EXTRACTABLE_TEXT",
          message:
            "Não foi possível extrair texto. Preencha o formulário manualmente.",
        },
      ],
    });
  });
});
