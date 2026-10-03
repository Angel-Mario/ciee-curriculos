import { parseListCandidatesQuery } from "@ciee-curriculos/shared";
import type { ListCandidatesQuery } from "@ciee-curriculos/shared";

import type { Candidate } from "./candidates";

export const candidateColumns = [
  { key: "fullName", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "interestArea", label: "Área de interesse" },
] as const;

export type CandidateSortField = ListCandidatesQuery["sortBy"];

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

export function parseCandidateListSearch(
  search: Record<string, unknown>
): ListCandidatesQuery {
  const query = parseListCandidatesQuery(search);
  if (query.sortBy === "id") {
    return { ...query, sortBy: "fullName", sortOrder: "asc" };
  }
  return query;
}

function getSortValue(
  candidate: Candidate,
  field: CandidateSortField
): string | number | null {
  if (field === "id") {
    return candidate.id;
  }
  const value = candidate[field]?.trim();
  if (!value) {
    return null;
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
