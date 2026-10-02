import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DbService } from "../../database/db.service.js";
import { CandidatesService } from "./candidates.service.js";

describe("candidate persistence service", () => {
  const prisma = {
    candidate: {
      create: vi.fn<() => Promise<unknown>>(),
      deleteMany: vi.fn<() => Promise<{ count: number }>>(),
      findMany: vi.fn<() => Promise<unknown[]>>(),
      findUnique: vi.fn<() => Promise<unknown>>(),
    },
  };
  const service = new CandidatesService({ prisma } as unknown as DbService);

  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(prisma.candidate.create).toHaveBeenCalledWith({ data: input });
  });

  it("lists candidates newest first", async () => {
    prisma.candidate.findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toStrictEqual([]);
    expect(prisma.candidate.findMany).toHaveBeenCalledWith({
      orderBy: { id: "desc" },
    });
  });

  it("looks up one candidate by ID", async () => {
    const candidate = { fullName: "Ana Souza", id: 8 };
    prisma.candidate.findUnique.mockResolvedValue(candidate);

    await expect(service.findById(8)).resolves.toStrictEqual(candidate);
    expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
    });
  });

  it("deletes one candidate using a count result", async () => {
    prisma.candidate.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deleteById(8)).resolves.toStrictEqual({ count: 1 });
    expect(prisma.candidate.deleteMany).toHaveBeenCalledWith({
      where: { id: 8 },
    });
  });

  it("deletes only candidates whose IDs are requested", async () => {
    prisma.candidate.deleteMany.mockResolvedValue({ count: 2 });

    await expect(service.deleteMany([8, 9])).resolves.toStrictEqual({
      count: 2,
    });
    expect(prisma.candidate.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [8, 9] } },
    });
  });
});
