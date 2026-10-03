import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import {
  createCandidateMutationOptions,
  deleteCandidateMutationOptions,
} from "@/lib/candidate-mutations";
import { candidateKeys } from "@/lib/candidate-queries";
import type { Candidate } from "@/lib/candidates";

const candidate: Candidate = {
  email: "ana@example.com",
  fullName: "Ana Souza",
  hasCurriculum: false,
  id: 7,
  interestArea: null,
  phone: null,
  professionalSummary: null,
};
const input = {
  email: candidate.email,
  fullName: candidate.fullName,
  interestArea: "",
  phone: "",
  professionalSummary: "",
};

describe("candidate query cache mutations", () => {
  it("isolates cached lists by query state", () => {
    const firstKey = candidateKeys.list({
      hasCurriculum: "all",
      interestArea: undefined,
      page: 1,
      pageSize: 10,
      q: "ana",
      sortBy: "fullName",
      sortOrder: "asc",
    });
    const secondKey = candidateKeys.list({
      hasCurriculum: "all",
      interestArea: undefined,
      page: 2,
      pageSize: 10,
      q: "ana",
      sortBy: "fullName",
      sortOrder: "asc",
    });

    expect(firstKey).not.toStrictEqual(secondKey);
  });

  it("invalidates list queries and seeds the newly created detail", async () => {
    const queryClient = new QueryClient();
    const listKey = candidateKeys.list({
      hasCurriculum: "all",
      interestArea: undefined,
      page: 1,
      pageSize: 10,
      q: undefined,
      sortBy: "id",
      sortOrder: "desc",
    });
    queryClient.setQueryData(listKey, { items: [], total: 0 });
    const create = vi.fn().mockResolvedValue(candidate);
    const mutation = createCandidateMutationOptions(queryClient);

    await mutation.onSuccess?.(await create(), { input }, undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    });

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryData(candidateKeys.detail(candidate.id))
    ).toEqual(candidate);
  });

  it("invalidates all list variants and removes deleted detail data", async () => {
    const queryClient = new QueryClient();
    const listKey = candidateKeys.list({
      hasCurriculum: "all",
      interestArea: undefined,
      page: 2,
      pageSize: 25,
      q: "ana",
      sortBy: "email",
      sortOrder: "asc",
    });
    queryClient.setQueryData(listKey, { items: [candidate], total: 1 });
    queryClient.setQueryData(candidateKeys.detail(candidate.id), candidate);
    const mutation = deleteCandidateMutationOptions(queryClient);

    await mutation.onSuccess?.(undefined, candidate.id, undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    });

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(candidateKeys.detail(candidate.id))).toBe(
      undefined
    );
  });
});
