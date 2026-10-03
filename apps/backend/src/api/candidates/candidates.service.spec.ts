import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DbService } from "../../database/db.service.js";
import type { S3Service } from "../../s3/s3.service.js";
import { CandidatesService } from "./candidates.service.js";

describe("candidate persistence service", () => {
  const prisma = {
    candidate: {
      count: vi.fn<() => Promise<number>>(),
      create: vi.fn<() => Promise<unknown>>(),
      deleteMany: vi.fn<() => Promise<{ count: number }>>(),
      findMany: vi.fn<() => Promise<unknown[]>>(),
      findUnique: vi.fn<() => Promise<unknown>>(),
    },
  };
  const s3 = {
    buildPublicUrl: vi.fn<(key: string) => string>(
      (key) => `http://localhost:9000/curricula/${key}`
    ),
    deleteFile: vi.fn<() => Promise<void>>(),
    uploadFile: vi.fn<() => Promise<void>>(),
  };
  const service = new CandidatesService(
    { prisma } as unknown as DbService,
    s3 as unknown as S3Service
  );

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.candidate.findUnique.mockResolvedValue(null);
    prisma.candidate.count.mockResolvedValue(0);
  });

  it("creates a candidate through Prisma", async () => {
    const input = {
      email: "ana@example.com",
      fullName: "Ana Souza",
      interestArea: null,
      phone: null,
      professionalSummary: null,
    };
    const saved = { id: 8, ...input };
    prisma.candidate.create.mockResolvedValue(saved);

    await expect(service.create(input)).resolves.toStrictEqual(saved);
    expect(prisma.candidate.create).toHaveBeenCalledWith({
      data: input,
      include: { curriculumFile: true },
    });
  });

  it("lists candidates newest first", async () => {
    prisma.candidate.findMany.mockResolvedValue([]);

    await expect(
      service.findAll({
        hasCurriculum: "all",
        interestArea: undefined,
        page: 1,
        pageSize: 10,
        q: undefined,
        sortBy: "id",
        sortOrder: "desc",
      })
    ).resolves.toStrictEqual({
      items: [],
      page: 1,
      pageCount: 0,
      pageSize: 10,
      total: 0,
    });
    expect(prisma.candidate.findMany).toHaveBeenCalledWith({
      include: { curriculumFile: true },
      orderBy: { id: "desc" },
      skip: 0,
      take: 10,
      where: {},
    });
  });

  it("rejects duplicate emails before uploading a PDF or creating a row", async () => {
    prisma.candidate.findUnique.mockResolvedValue({ id: 8 });
    await expect(
      service.create(
        {
          email: "ana@example.com",
          fullName: "Ana",
          interestArea: null,
          phone: null,
          professionalSummary: null,
        },
        { buffer: Buffer.from("%PDF-"), originalName: "resume.pdf", size: 5 }
      )
    ).rejects.toMatchObject({
      response: { code: "EMAIL_ALREADY_IN_USE" },
      status: 409,
    });
    expect(s3.uploadFile).not.toHaveBeenCalled();
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  it("maps a concurrent unique constraint violation to a conflict", async () => {
    prisma.candidate.create.mockRejectedValueOnce({ code: "P2002" });
    await expect(
      service.create({
        email: "ana@example.com",
        fullName: "Ana",
        interestArea: null,
        phone: null,
        professionalSummary: null,
      })
    ).rejects.toMatchObject({
      response: { code: "EMAIL_ALREADY_IN_USE" },
      status: 409,
    });
  });

  it("filters name or email occurrences and sorts by requested field", async () => {
    prisma.candidate.findMany.mockResolvedValue([]);
    prisma.candidate.count.mockResolvedValue(0);

    await service.findAll({
      hasCurriculum: "yes",
      interestArea: "Design",
      page: 2,
      pageSize: 5,
      q: "ana",
      sortBy: "email",
      sortOrder: "asc",
    });

    expect(prisma.candidate.findMany).toHaveBeenCalledWith({
      include: { curriculumFile: true },
      orderBy: [{ email: "asc" }, { id: "asc" }],
      skip: 5,
      take: 5,
      where: {
        OR: [{ fullName: { contains: "ana" } }, { email: { contains: "ana" } }],
        curriculumFile: { isNot: null },
        interestArea: { contains: "Design" },
      },
    });
    expect(prisma.candidate.count).toHaveBeenCalledWith({
      where: {
        OR: [{ fullName: { contains: "ana" } }, { email: { contains: "ana" } }],
        curriculumFile: { isNot: null },
        interestArea: { contains: "Design" },
      },
    });
  });

  it("looks up one candidate by ID", async () => {
    const candidate = { fullName: "Ana Souza", id: 8 };
    prisma.candidate.findUnique.mockResolvedValue(candidate);

    await expect(service.findById(8)).resolves.toStrictEqual(candidate);
    expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
      include: { curriculumFile: true },
      where: { id: 8 },
    });
  });

  it("serializes curriculum metadata without constructing a download URL", () => {
    const response = service.toResponse({
      curriculumFile: {
        id: 1,
        originalName: "resume.pdf",
        sizeBytes: 100,
        storageKey: "file.pdf",
        uploadedAt: new Date(),
      },
      id: 8,
    });

    expect(response.curriculum).not.toHaveProperty("url");
    expect(response.curriculum).not.toHaveProperty("storageKey");
    expect(response).not.toHaveProperty("curriculumFile");
    expect(s3.buildPublicUrl).not.toHaveBeenCalled();
  });

  it("constructs a URL for an explicit download request", async () => {
    prisma.candidate.findUnique.mockResolvedValue({
      curriculumFile: { storageKey: "file.pdf" },
    });

    await expect(service.getCurriculumDownload(8)).resolves.toStrictEqual({
      url: "http://localhost:9000/curricula/file.pdf",
    });
    expect(s3.buildPublicUrl).toHaveBeenCalledWith("file.pdf");
  });

  it.each([null, { curriculumFile: null }])(
    "rejects download requests when the candidate or curriculum is missing: %o",
    async (candidate) => {
      prisma.candidate.findUnique.mockResolvedValue(candidate);

      await expect(service.getCurriculumDownload(8)).rejects.toMatchObject({
        status: 404,
      });
      expect(s3.buildPublicUrl).not.toHaveBeenCalled();
    }
  );

  it("deletes one candidate using a count result", async () => {
    prisma.candidate.findUnique.mockResolvedValue({ curriculumFile: null });
    prisma.candidate.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deleteById(8)).resolves.toStrictEqual({ count: 1 });
    expect(prisma.candidate.deleteMany).toHaveBeenCalledWith({
      where: { id: 8 },
    });
  });

  it("deletes only candidates whose IDs are requested", async () => {
    prisma.candidate.findMany.mockResolvedValue([]);
    prisma.candidate.deleteMany.mockResolvedValue({ count: 2 });

    await expect(service.deleteMany([8, 9])).resolves.toStrictEqual({
      count: 2,
    });
    expect(prisma.candidate.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [8, 9] } },
    });
  });
});
