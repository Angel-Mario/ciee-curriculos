import { z } from "zod";

export const CANDIDATE_SORT_FIELDS = [
  "id",
  "fullName",
  "email",
  "phone",
  "interestArea",
] as const;

const MAX_CANDIDATE_ID = 2_147_483_647;
const optionalText = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null);

export const createCandidateSchema = z
  .object({
    email: z.string().trim().toLowerCase().min(1).max(254).pipe(z.email()),
    fullName: z.string().trim().min(1).max(200),
    interestArea: optionalText(200),
    phone: optionalText(32)
      .refine((value) => value === null || /^\+?[\d\s().-]+$/u.test(value), {
        message:
          "Phone must contain only digits and phone formatting characters.",
      })
      .transform((value) =>
        value === null ? null : value.replaceAll(/[\s().-]/gu, "")
      )
      .refine((value) => value === null || /^\+?\d{10,15}$/u.test(value), {
        message: "Phone must contain 10 to 15 digits.",
      }),
    professionalSummary: optionalText(2000),
  })
  .strict();

export const listCandidatesQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    sortBy: z.enum(CANDIDATE_SORT_FIELDS).default("id"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const deleteCandidatesSchema = z
  .object({
    ids: z
      .array(z.number().int().positive().max(MAX_CANDIDATE_ID))
      .min(1)
      .max(100)
      .transform((ids) => [...new Set(ids)]),
  })
  .strict();

const curriculumSchema = z.object({
  id: z.number().int().positive(),
  originalName: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  uploadedAt: z.iso.datetime(),
});

export const candidateSchema = z.object({
  createdAt: z.iso.datetime().optional(),
  curriculum: curriculumSchema.nullable().optional(),
  email: z.email(),
  fullName: z.string(),
  hasCurriculum: z.boolean().optional(),
  id: z.number().int().positive(),
  interestArea: z.string().nullable(),
  phone: z.string().nullable(),
  professionalSummary: z.string().nullable(),
});

export const pdfImportResultSchema = z.object({
  data: z.object({
    email: z.email().nullable(),
    fullName: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  missingFields: z.array(z.string()),
  warnings: z.array(z.object({ code: z.string(), message: z.string() })),
});

export const curriculumDownloadSchema = z.object({ url: z.url() });

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>;
export type DeleteCandidatesInput = z.infer<typeof deleteCandidatesSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type Curriculum = z.infer<typeof curriculumSchema>;
export type PdfImportResult = z.infer<typeof pdfImportResultSchema>;
