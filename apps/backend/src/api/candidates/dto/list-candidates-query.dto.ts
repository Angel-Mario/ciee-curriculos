import { z } from "zod";

const SORT_FIELDS = [
  "id",
  "fullName",
  "email",
  "phone",
  "interestArea",
] as const;

export class ListCandidatesQueryDto {
  static readonly schema = z
    .object({
      q: z.string().trim().max(200).optional(),
      sortBy: z.enum(SORT_FIELDS).default("id"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict();
}

export type ListCandidatesQuery = z.infer<typeof ListCandidatesQueryDto.schema>;
