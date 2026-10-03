import type { Candidate } from "./candidates";

export const candidateColumns = [
  { key: "fullName", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "interestArea", label: "Área de interesse" },
  { key: "createdAt", label: "Data de cadastro" },
] as const;

export type CandidateSortField = (typeof candidateColumns)[number]["key"];

const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});
const NON_DIGITS = /\D/gu;

export function isCandidateSortField(
  value: string | null
): value is CandidateSortField {
  return candidateColumns.some((column) => column.key === value);
}

function getSortValue(
  candidate: Candidate,
  field: CandidateSortField
): string | number | null {
  const value = candidate[field]?.trim();
  if (!value) {
    return null;
  }
  if (field === "createdAt") {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  if (field === "phone") {
    return value.replaceAll(NON_DIGITS, "");
  }
  return value;
}

export function compareCandidates(
  first: Candidate,
  second: Candidate,
  field: CandidateSortField,
  ascending: boolean
): number {
  const firstValue = getSortValue(first, field);
  const secondValue = getSortValue(second, field);
  // Missing values stay at the end in either direction.
  if (firstValue === null && secondValue !== null) {
    return 1;
  }
  if (secondValue === null && firstValue !== null) {
    return -1;
  }
  let comparison = 0;
  if (typeof firstValue === "number" && typeof secondValue === "number") {
    comparison = firstValue - secondValue;
  } else if (
    typeof firstValue === "string" &&
    typeof secondValue === "string"
  ) {
    comparison = collator.compare(firstValue, secondValue);
  }
  if (comparison !== 0) {
    return ascending ? comparison : -comparison;
  }
  return (
    collator.compare(first.fullName, second.fullName) || first.id - second.id
  );
}
