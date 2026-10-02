import { Injectable, Inject } from "@nestjs/common";

import type { PrismaClient } from "../../orm/prisma/generated/client.js";
import { ISqlAdapter } from "../interfaces/db-adapter.interface.js";

@Injectable()
export class PrismaSqlAdapter implements ISqlAdapter<PrismaClient> {
  constructor(
    @Inject("PRISMA_SQL_CLIENT") private readonly prisma: PrismaClient
  ) {}

  query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.prisma.$queryRawUnsafe<T[]>(sql, ...params);
  }

  execute(sql: string, params: unknown[] = []): Promise<number> {
    return this.prisma.$executeRawUnsafe(sql, ...params);
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
