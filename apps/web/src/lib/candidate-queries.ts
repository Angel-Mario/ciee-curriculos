import type { ListCandidatesQuery } from "@ciee-curriculos/shared";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getCandidate, listCandidates } from "@/lib/candidates";

export const candidateKeys = {
  all: ["candidates"] as const,
  detail: (id: number) => [...candidateKeys.details(), id] as const,
  details: () => [...candidateKeys.all, "detail"] as const,
  list: (query: ListCandidatesQuery) =>
    [...candidateKeys.lists(), query] as const,
  lists: () => [...candidateKeys.all, "list"] as const,
};

export const candidateListOptions = (query: ListCandidatesQuery) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => listCandidates(query, signal),
    queryKey: candidateKeys.list(query),
  });

export const candidateDetailOptions = (id: number) =>
  queryOptions({
    queryFn: ({ signal }) => getCandidate(id, signal),
    queryKey: candidateKeys.detail(id),
  });
