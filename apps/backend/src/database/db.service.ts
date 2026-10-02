import { Injectable, Inject } from "@nestjs/common";

import type { ISqlAdapter } from "./adapters/interfaces/db-adapter.interface.js";
import type { PrismaClient } from "./orm/prisma/generated/client.js";

type SqlClient = PrismaClient;

@Injectable()
export class DbService {
  constructor(@Inject("SQL_ADAPTER") readonly sql: ISqlAdapter<SqlClient>) {}

  get raw() {
    return {
      sql: this.sql.getClient(),
    };
  }
  get prisma(): PrismaClient {
    return this.sql.getClient();
  }
}
