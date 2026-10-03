import { brazilianPhoneSchema } from "@ciee-curriculos/shared";
import { z } from "zod";

export const extractedFieldNames = ["fullName", "email", "phone"] as const;

export type ExtractedFieldName = (typeof extractedFieldNames)[number];
export type ExtractedCandidateFields = Record<
  ExtractedFieldName,
  string | null
>;

const emailSchema = z.email();
const emailPattern = /[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/gu;
const phonePattern = /(?:\+?\d[\d \t().-]{7,}\d)/gu;
const sectionPattern =
  /^(?:curr[ií]culo|resume|resumo|perfil|objetivo|experi[eê]ncia|forma[cç][aã]o|educa[cç][aã]o|habilidades|compet[eê]ncias|contato|stack|projetos|certifica[cç][oõ]es)\b/iu;
const nameLabelPattern =
  /^(?:nome(?: completo)?|name)\s*[:-]\s*(?<value>.+)$/iu;
const nameLabelReplacePattern =
  /^(?:nome(?: completo)?|name)\s*[:-]\s*(?<value>.+)$/giu;
const contactLabelPattern = /(?:telefone|celular|phone|contato)\s*[:-]?/iu;
const linkPattern =
  /(?:https?:\/\/|www\.|github|linkedin|portf[oó]lio|\.[a-z]{2,}(?:\/|\b))/iu;
const namePattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)+$/u;
const inlinePhonePattern = /\s*(?:\||[–—])?\s*\+?\d[\d \t().-]{7,}\d\s*$/u;
const brazilianLocationPattern =
  /\s+[\p{L}\p{M}.-]+,\s*[A-Z]{2},\s*(?:Brasil|Brazil)\s*$/u;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizeName(line: string): string | null {
  const candidate = line
    .replaceAll(nameLabelReplacePattern, "$<value>")
    .replace(inlinePhonePattern, "")
    .replace(brazilianLocationPattern, "")
    .trim();
  if (
    candidate.length === 0 ||
    candidate.length > 200 ||
    candidate.includes("@") ||
    linkPattern.test(candidate) ||
    !namePattern.test(candidate) ||
    /\d/u.test(candidate) ||
    sectionPattern.test(candidate)
  ) {
    return null;
  }

  return candidate;
}

export function extractCandidateFields(text: string): {
  data: ExtractedCandidateFields;
  missingFields: ExtractedFieldName[];
  warnings: { code: string; message: string }[];
} {
  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.replaceAll(/\s+/gu, " ").trim())
    .filter(Boolean);
  const emailMatches = unique(
    [...text.matchAll(emailPattern)]
      .map(([value]) => value.replaceAll(/[.,;:]+$/gu, ""))
      .filter((value) => emailSchema.safeParse(value).success)
  );
  const phoneMatches = unique(
    [...text.matchAll(phonePattern)]
      .map(([value]) => brazilianPhoneSchema.safeParse(value))
      .flatMap((result) => (result.success && result.data ? [result.data] : []))
  );

  const labelledName = lines.find((line) => nameLabelPattern.test(line));
  const firstSectionIndex = lines.findIndex((line) =>
    sectionPattern.test(line)
  );
  const headerLines = lines.slice(
    0,
    firstSectionIndex === -1 ? 10 : Math.min(firstSectionIndex, 10)
  );
  const nameCandidates = labelledName
    ? [normalizeName(labelledName)]
    : headerLines
        .filter((line) => !contactLabelPattern.test(line))
        .map(normalizeName)
        .filter((value): value is string => value !== null)
        .slice(0, 1);
  const uniqueNames = unique(
    nameCandidates.filter((value): value is string => value !== null)
  );

  const data: ExtractedCandidateFields = {
    email: emailMatches.length === 1 ? emailMatches[0] : null,
    fullName: uniqueNames.length === 1 ? uniqueNames[0] : null,
    phone: phoneMatches.length === 1 ? phoneMatches[0] : null,
  };

  const missingFields = extractedFieldNames.filter(
    (field) => data[field] === null
  );
  const warnings: { code: string; message: string }[] = [];

  if (text.trim().length === 0) {
    warnings.push({
      code: "NO_EXTRACTABLE_TEXT",
      message:
        "Não foi possível extrair texto. Preencha o formulário manualmente.",
    });
  }
  if (emailMatches.length > 1) {
    warnings.push({
      code: "EMAIL_AMBIGUOUS",
      message:
        "Mais de um e-mail foi encontrado. Informe o e-mail correto manualmente.",
    });
  }
  if (phoneMatches.length > 1) {
    warnings.push({
      code: "PHONE_AMBIGUOUS",
      message:
        "Mais de um telefone foi encontrado. Informe o telefone correto manualmente.",
    });
  }
  if (uniqueNames.length > 1) {
    warnings.push({
      code: "NAME_AMBIGUOUS",
      message:
        "Não foi possível determinar o nome com segurança. Informe-o manualmente.",
    });
  }
  if (
    text.trim().length > 0 &&
    missingFields.length > 0 &&
    warnings.length === 0
  ) {
    warnings.push({
      code: "PARTIAL_EXTRACTION",
      message:
        "Alguns campos não foram identificados. Complete-os manualmente.",
    });
  }

  return { data, missingFields, warnings };
}
