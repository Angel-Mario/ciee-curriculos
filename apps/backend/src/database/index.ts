// oxlint-disable oxc/no-barrel-file
// biome-ignore-all lint/performance/noBarrelFile: Public entry point shared with the monorepo database package.
export * from "./db.module.js";
export * from "./db.service.js";
export type { PrismaClient } from "./orm/prisma/generated/client.js";
export type { Todo } from "./orm/prisma/generated/client.js";
export * from "./adapters/interfaces/db-adapter.interface.js";
