import { createCandidateSchema } from "@ciee-curriculos/shared";

export class CreateCandidateDto {
  static readonly schema = createCandidateSchema;
}

export type { CreateCandidateInput } from "@ciee-curriculos/shared";
