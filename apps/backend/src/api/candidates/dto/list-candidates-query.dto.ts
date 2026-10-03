import { listCandidatesQuerySchema } from "@ciee-curriculos/shared";

export class ListCandidatesQueryDto {
  static readonly schema = listCandidatesQuerySchema;
}

export type { ListCandidatesQuery } from "@ciee-curriculos/shared";
