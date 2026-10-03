import { randomUUID } from "node:crypto";

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { DbService } from "../../database/db.service.js";
import { S3Service } from "../../s3/s3.service.js";
import type { CreateCandidateInput } from "./dto/create-candidate.dto.js";
import type { ListCandidatesQuery } from "./dto/list-candidates-query.dto.js";

export interface CandidatePdf {
  buffer: Buffer;
  originalName: string;
  size: number;
}

interface CandidateWithCurriculum {
  curriculumFile: {
    id: number;
    originalName: string;
    sizeBytes: number;
    storageKey: string;
    uploadedAt: Date;
  } | null;
  [key: string]: unknown;
}

@Injectable()
export class CandidatesService {
  constructor(
    private readonly db: DbService,
    private readonly s3Service: S3Service
  ) {}

  async create(input: CreateCandidateInput, file?: CandidatePdf) {
    const existingCandidate = await this.db.prisma.candidate.findUnique({
      select: { id: true },
      where: { email: input.email },
    });
    if (existingCandidate) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_IN_USE",
        message: "Já existe um candidato cadastrado com este e-mail.",
      });
    }
    const storageKey = file ? `${randomUUID()}.pdf` : undefined;
    if (file && storageKey) {
      await this.s3Service.uploadFile(file.buffer, storageKey);
    }

    try {
      return await this.db.prisma.candidate.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          interestArea: input.interestArea,
          phone: input.phone,
          professionalSummary: input.professionalSummary,
          ...(file && storageKey
            ? {
                curriculumFile: {
                  create: {
                    mimeType: "application/pdf",
                    originalName:
                      file.originalName.split(/[\\/]/u).at(-1)?.slice(0, 260) ||
                      "curriculum.pdf",
                    sizeBytes: file.size,
                    storageKey,
                  },
                },
              }
            : {}),
        },
        include: { curriculumFile: true },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException({
          code: "EMAIL_ALREADY_IN_USE",
          message: "Já existe um candidato cadastrado com este e-mail.",
        });
      }
      throw error;
    }
  }

  findAll(query: ListCandidatesQuery) {
    const where: {
      OR?: { fullName?: { contains: string }; email?: { contains: string } }[];
      interestArea?: { contains: string };
      curriculumFile?: { is?: null; isNot?: null };
    } = {
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q } },
              { email: { contains: query.q } },
            ],
          }
        : {}),
      ...(query.interestArea
        ? { interestArea: { contains: query.interestArea } }
        : {}),
    };
    if (query.hasCurriculum === "yes") {
      where.curriculumFile = { isNot: null };
    } else if (query.hasCurriculum === "no") {
      where.curriculumFile = { is: null };
    }
    const orderBy =
      query.sortBy === "id"
        ? { id: query.sortOrder }
        : [{ [query.sortBy]: query.sortOrder }, { id: query.sortOrder }];
    const skip = (query.page - 1) * query.pageSize;

    return Promise.all([
      this.db.prisma.candidate.findMany({
        include: { curriculumFile: true },
        orderBy,
        skip,
        take: query.pageSize,
        where,
      }),
      this.db.prisma.candidate.count({ where }),
    ]).then(([items, total]) => ({
      items,
      page: query.page,
      pageCount: Math.ceil(total / query.pageSize),
      pageSize: query.pageSize,
      total,
    }));
  }

  findById(id: number) {
    return this.db.prisma.candidate.findUnique({
      include: { curriculumFile: true },
      where: { id },
    });
  }

  async getCurriculumDownload(id: number) {
    const candidate = await this.db.prisma.candidate.findUnique({
      select: {
        curriculumFile: { select: { storageKey: true } },
      },
      where: { id },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate ${id} was not found.`);
    }
    if (!candidate.curriculumFile) {
      throw new NotFoundException("Candidate has no curriculum.");
    }

    return {
      url: this.s3Service.buildPublicUrl(candidate.curriculumFile.storageKey),
    };
  }

  async deleteById(id: number) {
    const candidate = await this.db.prisma.candidate.findUnique({
      include: { curriculumFile: true },
      where: { id },
    });
    if (!candidate) {
      return { count: 0 };
    }
    if (candidate.curriculumFile) {
      await this.s3Service.deleteFile(candidate.curriculumFile.storageKey);
    }
    return this.db.prisma.candidate.deleteMany({ where: { id } });
  }

  async deleteMany(ids: number[]) {
    const candidates = await this.db.prisma.candidate.findMany({
      include: { curriculumFile: true },
      where: { id: { in: ids } },
    });
    await Promise.all(
      candidates.flatMap((candidate) =>
        candidate.curriculumFile
          ? [this.s3Service.deleteFile(candidate.curriculumFile.storageKey)]
          : []
      )
    );
    return this.db.prisma.candidate.deleteMany({
      where: { id: { in: ids } },
    });
  }

  toResponse(candidate: CandidateWithCurriculum) {
    const { curriculumFile, ...fields } = candidate;
    return {
      ...fields,
      curriculum: curriculumFile
        ? {
            id: curriculumFile.id,
            originalName: curriculumFile.originalName,
            sizeBytes: curriculumFile.sizeBytes,
            uploadedAt: curriculumFile.uploadedAt,
          }
        : null,
    };
  }

  toListResponse(candidate: CandidateWithCurriculum) {
    const { curriculumFile, ...fields } = candidate;
    return { ...fields, hasCurriculum: Boolean(curriculumFile) };
  }
}
