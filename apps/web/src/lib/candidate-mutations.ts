import { mutationOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { candidateKeys } from "@/lib/candidate-queries";
import { createCandidate, deleteCandidate } from "@/lib/candidates";
import type { CandidateInput } from "@/lib/candidates";

export const createCandidateMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ input, file }: { input: CandidateInput; file?: File }) =>
      createCandidate(input, file),
    onSuccess: async (candidate) => {
      await queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
      queryClient.setQueryData(candidateKeys.detail(candidate.id), candidate);
    },
  });

export const deleteCandidateMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: deleteCandidate,
    onSuccess: async (_, candidateId) => {
      await queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
      queryClient.removeQueries({
        exact: true,
        queryKey: candidateKeys.detail(candidateId),
      });
    },
  });
