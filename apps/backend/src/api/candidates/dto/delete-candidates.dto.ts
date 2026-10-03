import { deleteCandidatesSchema } from "@ciee-curriculos/shared";

export class DeleteCandidatesDto {
  static readonly schema = deleteCandidatesSchema;
}

export type { DeleteCandidatesInput } from "@ciee-curriculos/shared";
