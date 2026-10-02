import { createPrismaClient } from "@ciee-curriculos/db";

import { ENV } from "./env.server";

export const db = createPrismaClient(ENV);
