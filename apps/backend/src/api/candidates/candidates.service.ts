import { Injectable } from "@nestjs/common";

import { DbService } from "../../database/db.service.js";
import type { CreateCandidateInput } from "./dto/create-candidate.dto.js";

@Injectable()
export class CandidatesService {
  constructor(private readonly db: DbService) {}

  create(input: CreateCandidateInput) {
    return this.db.prisma.candidate.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        interestArea: input.interestArea,
        phone: input.phone,
        professionalSummary: input.professionalSummary,
      },
    });
  }

  findAll() {
    return this.db.prisma.candidate.findMany({
      orderBy: { id: "desc" },
    });
  }

  findById(id: number) {
    return this.db.prisma.candidate.findUnique({ where: { id } });
  }

  deleteById(id: number) {
    return this.db.prisma.candidate.deleteMany({ where: { id } });
  }

  deleteMany(ids: number[]) {
    return this.db.prisma.candidate.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
