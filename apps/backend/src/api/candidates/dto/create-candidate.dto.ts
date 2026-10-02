import { z } from "zod";

const optionalText = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null);

export class CreateCandidateDto {
  static readonly schema = z
    .object({
      email: z.string().trim().min(1).max(254).pipe(z.email()),
      fullName: z.string().trim().min(1).max(200),
      interestArea: optionalText(200),
      phone: optionalText(32),
      professionalSummary: optionalText(2000),
    })
    .strict();
}

export type CreateCandidateInput = z.infer<typeof CreateCandidateDto.schema>;
