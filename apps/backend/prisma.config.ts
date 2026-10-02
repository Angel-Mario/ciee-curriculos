import { defineConfig } from "prisma/config";

import { env } from "./src/config/env.js";

export default defineConfig({
  datasource: {
    url: `sqlserver://${env.SQLSERVER_HOST}:${env.SQLSERVER_PORT};database=${env.SQLSERVER_DATABASE};user={${env.SQLSERVER_USER.replaceAll("}", "}}")}};password={${env.SQLSERVER_PASSWORD.replaceAll("}", "}}")}};encrypt=${env.SQLSERVER_ENCRYPT};trustServerCertificate=${env.SQLSERVER_TRUST_SERVER_CERTIFICATE}`,
  },
  migrations: {
    path: "src/database/orm/prisma/migrations",
  },
  schema: "src/database/orm/prisma/schema.prisma",
});
