import { z } from "zod";

const BRAZILIAN_AREA_CODE_PATTERN =
  /^(?:1[1-9]|2[12478]|3[1-578]|4[1-9]|5[1345]|6[1-9]|7[134579]|8[1-9]|9[1-9])$/u;
const BRAZILIAN_SUBSCRIBER_PATTERN = /^(?:[2-5]\d{7}|9\d{8})$/u;
const PHONE_FORMATTING_PATTERN = /[\s().-]/gu;
const PHONE_CHARACTERS_PATTERN = /^\+?\d+$/u;
const BRAZILIAN_INTERNATIONAL_PHONE_PATTERN = /^\+55\d{10,11}$/u;

export const BRAZILIAN_PHONE_ERROR =
  "Informe um telefone brasileiro com DDD válido: 10 dígitos para fixo ou 11 para celular (iniciado em 9). Apenas +55 é aceito.";

export function normalizeBrazilianPhone(value: string): string {
  const compact = value.trim().replaceAll(PHONE_FORMATTING_PATTERN, "");
  if (BRAZILIAN_INTERNATIONAL_PHONE_PATTERN.test(compact)) {
    return compact.slice(3);
  }
  // A national number can itself start with DDD 55.
  if (
    compact.startsWith("55") &&
    (compact.length === 12 || compact.length === 13)
  ) {
    return compact.slice(2);
  }
  return compact;
}

export const brazilianPhoneSchema = z
  .string()
  .trim()
  .max(32, BRAZILIAN_PHONE_ERROR)
  .refine(
    (value) =>
      value === "" ||
      PHONE_CHARACTERS_PATTERN.test(
        value.replaceAll(PHONE_FORMATTING_PATTERN, "")
      ),
    BRAZILIAN_PHONE_ERROR
  )
  .transform(normalizeBrazilianPhone)
  .refine(
    (value) =>
      value === "" ||
      (BRAZILIAN_AREA_CODE_PATTERN.test(value.slice(0, 2)) &&
        BRAZILIAN_SUBSCRIBER_PATTERN.test(value.slice(2))),
    BRAZILIAN_PHONE_ERROR
  )
  .nullable()
  .optional()
  .transform((value) => value || null);
