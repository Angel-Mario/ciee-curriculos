import { z } from "zod";

import { brazilianPhoneSchema } from "./phone.js";

export const CANDIDATE_SORT_FIELDS = [
  "id",
  "fullName",
  "email",
  "phone",
  "interestArea",
] as const;

export const interestAreas = [
  "Administração",
  "Análise de Dados",
  "Arquitetura e Urbanismo",
  "Assistente Administrativo",
  "Atendimento ao Cliente",
  "Auxiliar de Produção",
  "Biomedicina",
  "Ciências Contábeis",
  "Comércio Exterior",
  "Compras",
  "Comunicação e Jornalismo",
  "Departamento Pessoal",
  "Desenvolvimento Backend",
  "Desenvolvimento de Sistemas",
  "Desenvolvimento Frontend",
  "Desenvolvimento Full Stack",
  "Design",
  "Design de Interfaces (UI/UX)",
  "Direito",
  "Educação Física",
  "Enfermagem",
  "Engenharia Ambiental",
  "Engenharia Civil",
  "Engenharia de Produção",
  "Engenharia Elétrica",
  "Engenharia Mecânica",
  "Farmácia",
  "Finanças",
  "Fisioterapia",
  "Gastronomia",
  "Gestão de Projetos",
  "Gestão Pública",
  "Logística",
  "Marketing",
  "Nutrição",
  "Pedagogia",
  "Psicologia",
  "Qualidade",
  "Recepção",
  "Recursos Humanos",
  "Redes e Infraestrutura",
  "Secretariado",
  "Segurança da Informação",
  "Segurança do Trabalho",
  "Serviço Social",
  "Suporte Técnico",
  "Técnico em Informática",
  "Turismo e Hotelaria",
  "Vendas",
  "Veterinária",
];

const allowedInterestAreas = new Set(interestAreas);

const MAX_CANDIDATE_ID = 2_147_483_647;
const optionalText = (maximum: number, message: string) =>
  z
    .string()
    .max(maximum, message)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null);

export const createCandidateSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Informe o e-mail.")
      .max(254, "O e-mail deve ter no máximo 254 caracteres.")
      .pipe(
        z.email({ error: "Informe um e-mail válido, como nome@exemplo.com." })
      ),
    fullName: z
      .string()
      .trim()
      .min(1, "Informe o nome completo.")
      .max(200, "O nome deve ter no máximo 200 caracteres."),
    interestArea: optionalText(
      200,
      "A área ou cargo deve ter no máximo 200 caracteres."
    ).refine((value) => value === null || allowedInterestAreas.has(value), {
      message: "Selecione uma área ou cargo da lista de opções.",
    }),
    phone: brazilianPhoneSchema,
    professionalSummary: optionalText(
      2000,
      "O resumo deve ter no máximo 2000 caracteres."
    ),
  })
  .strict();

export const listCandidatesQuerySchema = z
  .object({
    hasCurriculum: z.enum(["all", "yes", "no"]).default("all"),
    interestArea: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).max(2_147_483_647).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    q: z.string().trim().max(200).optional(),
    sortBy: z.enum(CANDIDATE_SORT_FIELDS).default("id"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const DEFAULT_LIST_CANDIDATES_QUERY = listCandidatesQuerySchema.parse(
  {}
);

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

export const candidatePageSchema = z.object({
  items: z.array(candidateSchema),
  page: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const curriculumDownloadSchema = z.object({ url: z.url() });

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>;
export type DeleteCandidatesInput = z.infer<typeof deleteCandidatesSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type CandidatePage = z.infer<typeof candidatePageSchema>;
export type Curriculum = z.infer<typeof curriculumSchema>;
export type PdfImportResult = z.infer<typeof pdfImportResultSchema>;

export function parseListCandidatesQuery(input: unknown): ListCandidatesQuery {
  const parsed = listCandidatesQuerySchema.safeParse(input);
  return parsed.success ? parsed.data : listCandidatesQuerySchema.parse({});
}
