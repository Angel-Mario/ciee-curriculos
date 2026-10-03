import { describe, expect, it } from "vitest";

import { extractCandidateFields } from "./extract-candidate-fields.js";

describe("PDF contact extraction", () => {
  it("extracts a name from a header shared with location and phone", () => {
    const result = extractCandidateFields(
      "Angel Mario Roque Suárez Curitiba, PR, Brasil | +55 (41) 99742-9889\n" +
        "Portfólio: angelmario-portfolio.vercel.app E-mail: angelmarioroquesuarez@gmail.com\n" +
        "GitHub: github.com/Angel-Mario LinkedIn: linkedin.com/in/angel-mario-roque-suarez\n" +
        "RESUMO PROFISSIONAL\nDesenvolvedor Fullstack"
    );

    expect(result.data).toStrictEqual({
      email: "angelmarioroquesuarez@gmail.com",
      fullName: "Angel Mario Roque Suárez",
      phone: "41997429889",
    });
    expect(result.missingFields).toStrictEqual([]);
    expect(result.warnings).toStrictEqual([]);
  });

  it("leaves the name missing when only links and section content are available", () => {
    const result = extractCandidateFields(
      "GitHub: github.com/example LinkedIn: linkedin.com/in/example\n" +
        "ana@example.com\nRESUMO PROFISSIONAL\nDesenvolvedor Fullstack"
    );

    expect(result.data.fullName).toBeNull();
    expect(result.missingFields).toContain("fullName");
    expect(result.warnings[0]?.code).toBe("PARTIAL_EXTRACTION");
  });

  it("extracts labeled contact information from text", () => {
    expect(
      extractCandidateFields(
        "Nome completo: Ana Souza\nE-mail: ana@example.com\nTelefone: +55 (41) 99999-1234"
      )
    ).toStrictEqual({
      data: {
        email: "ana@example.com",
        fullName: "Ana Souza",
        phone: "41999991234",
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

  it("deduplicates equivalent national and international phone numbers", () => {
    const result = extractCandidateFields(
      "Nome: Ana Souza\nana@example.com\nTelefone: +55 (41) 99742-9889\nCelular: (41) 99742-9889"
    );
    expect(result.data.phone).toBe("41997429889");
    expect(result.warnings).toStrictEqual([]);
  });

  it.each(["+1 (212) 555-1234", "(20) 99999-1234", "(41) 89999-1234"])(
    "does not suggest an invalid or foreign phone: %s",
    (phone) => {
      const result = extractCandidateFields(
        `Nome: Ana Souza\nana@example.com\nTelefone: ${phone}`
      );
      expect(result.data.phone).toBeNull();
      expect(result.missingFields).toContain("phone");
      expect(result.warnings[0]?.code).toBe("PARTIAL_EXTRACTION");
    }
  );
});
