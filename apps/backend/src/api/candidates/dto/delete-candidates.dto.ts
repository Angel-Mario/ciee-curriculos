import { z } from "zod";

const MAX_CANDIDATE_ID = 2_147_483_647;
const MAX_CANDIDATES_PER_DELETE = 100;

export class DeleteCandidatesDto {
  static readonly schema = z
    .object({
      ids: z
        .array(z.number().int().positive().max(MAX_CANDIDATE_ID))
        .min(1)
        .max(MAX_CANDIDATES_PER_DELETE)
        .transform((ids) => [...new Set(ids)]),
    })
    .strict();
}

export type DeleteCandidatesInput = z.infer<typeof DeleteCandidatesDto.schema>;
