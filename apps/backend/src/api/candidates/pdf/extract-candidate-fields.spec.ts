import { describe, expect, it } from "vitest";

import { extractCandidateFields } from "./extract-candidate-fields.js";

describe("PDF contact extraction", () => {
  it.each([
    [
      "Ana Luiza Ferreira",
      "Ana Luiza Ferreira\nDesenvolvedora Front-end Júnior",
    ],
    [
      "Bruno Henrique Martins",
      "Bruno\nHenrique\nMartins\nAnalista de Suporte Técnico",
    ],
    ["Camila Ribeiro Santos", "Camila Ribeiro Santos UX/UI Designer"],
    ["Diego Almeida Costa", "Diego Almeida Costa\nDesenvolvedor Back-end Java"],
    ["Fernanda Oliveira Lima", "Fernanda\nOliveira Lima\nAnalista Financeira"],
    ["Gabriel Souza Nascimento", "Gabriel Souza\nNascimento\nTécnico em Redes"],
    ["Helena Mendes Rocha", "Helena Mendes Rocha\nCientista de Dados Júnior"],
    [
      "Igor Carvalho Pereira",
      "Igor Carvalho\nPereira\nDesenvolvedor Full Stack Pleno",
    ],
    [
      "Juliana Barbosa Freitas",
      "Juliana Barbosa\nFreitas\nAnalista de Recursos Humanos",
    ],
    [
      "Lucas Teixeira Moraes",
      "Lucas Teixeira Moraes\nEstagiário de Tecnologia da Informação",
    ],
  ])(
    "extracts the complete name from the synthetic PDF header: %s",
    (fullName, header) => {
      const result = extractCandidateFields(
        `CURRÍCULO SINTÉTICO - DADOS FICTÍCIOS PARA TESTE DE SOFTWARE Página 1\n${header}\nCONTATO\nCuritiba - PR\n(41) 90000-0101\ncontato@example.com\nRESUMO PROFISSIONAL\nExperiência em tecnologia.`
      );

      expect(result.data).toStrictEqual({
        email: "contato@example.com",
        fullName,
        phone: "41900000101",
      });
      expect(result.missingFields).toStrictEqual([]);
      expect(result.warnings).toStrictEqual([]);
    }
  );

  it("does not use section content as a name after a document title", () => {
    const result = extractCandidateFields(
      "CURRÍCULO\nRESUMO PROFISSIONAL\nAna Souza\nana@example.com"
    );

    expect(result.data.fullName).toBeNull();
  });

  it("does not use a job title or location as a name", () => {
    const result = extractCandidateFields(
      "CURRÍCULO\nAnalista de Sistemas\nSão Paulo\nana@example.com"
    );

    expect(result.data.fullName).toBeNull();
  });

  it("keeps labeled names authoritative over header suggestions", () => {
    const result = extractCandidateFields(
      "CURRÍCULO\nBruno Henrique Martins\nAnalista de Sistemas\nNome completo: Ana Souza"
    );

    expect(result.data.fullName).toBe("Ana Souza");
  });

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
