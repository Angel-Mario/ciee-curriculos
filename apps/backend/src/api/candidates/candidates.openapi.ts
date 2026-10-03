import {
  candidateSchema,
  candidatePageSchema,
  deleteCandidatesSchema,
  pdfImportResultSchema,
} from "@ciee-curriculos/shared";
import type { SchemaObject } from "@nestjs/swagger";
import { z } from "zod";

const openApiSchema = (schema: z.ZodType, io: "input" | "output" = "output") =>
  z.toJSONSchema(schema, { io, target: "openapi-3.0" }) as SchemaObject;

export const candidateResponseSchema = openApiSchema(candidateSchema);
export const candidatePageResponseSchema = openApiSchema(candidatePageSchema);
export const pdfImportResponseSchema = openApiSchema(pdfImportResultSchema);
export const deleteCandidatesRequestSchema = openApiSchema(
  deleteCandidatesSchema,
  "input"
);
export const deletedCountResponseSchema = openApiSchema(
  z.object({ deletedCount: z.number().int().nonnegative() })
);
export const deletedCandidateResponseSchema = openApiSchema(
  z.object({ id: z.number().int().positive() })
);
