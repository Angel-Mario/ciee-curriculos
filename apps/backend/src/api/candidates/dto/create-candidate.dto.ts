import { z } from "zod";

import { normalizePhone } from "../normalize-phone.js";

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
      email: z.string().trim().toLowerCase().min(1).max(254).pipe(z.email()),
      fullName: z.string().trim().min(1).max(200),
      interestArea: optionalText(200),
      phone: optionalText(32)
        .refine((value) => value === null || /^\+?[\d\s().-]+$/u.test(value), {
          message:
            "Phone must contain only digits and phone formatting characters.",
        })
        .transform((value) => (value === null ? null : normalizePhone(value)))
        .refine((value) => value === null || /^\+?\d{10,15}$/u.test(value), {
          message: "Phone must contain 10 to 15 digits.",
        }),
      professionalSummary: optionalText(2000),
    })
    .strict();
}

export type CreateCandidateInput = z.infer<typeof CreateCandidateDto.schema>;
