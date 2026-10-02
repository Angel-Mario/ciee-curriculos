import { DynamicModule, Module, Global, Provider } from "@nestjs/common";
import { PrismaMssql } from "@prisma/adapter-mssql";

import { PrismaClient } from "../database/orm/prisma/generated/client.js";
import { PrismaSqlAdapter } from "./adapters/sql/prisma-sql.adapter.js";
import { DbService } from "./db.service.js";

export interface DbModuleOptions {
  sqlserver?: {
    server: string;
    port: number;
    database: string;
    user: string;
    password: string;
    options: { encrypt: boolean; trustServerCertificate: boolean };
  };
}

@Global()
@Module({})
export class DbModule {
  static forRoot(options: DbModuleOptions): DynamicModule {
    const initialProviders: Provider[] = [DbService];
    const providers = initialProviders;

    if (!options.sqlserver) {
      throw new Error(
        "SQL Server connection settings are required to initialize Prisma"
      );
    }
    const sqlAdapter = new PrismaMssql(options.sqlserver);
    const prismaSql = new PrismaClient({ adapter: sqlAdapter });
    providers.push(
      {
        provide: "PRISMA_SQL_CLIENT",
        useValue: prismaSql,
      },
      {
        provide: "SQL_ADAPTER",
        useClass: PrismaSqlAdapter,
      }
    );

    return {
      exports: [DbService],
      module: DbModule,
      providers,
    };
  }
}
