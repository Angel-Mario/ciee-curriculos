import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  server: {
    CORS_ORIGIN: z.string().default("*"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.string().transform(Number).default(3000),
    S3_ACCESS_KEY: z.string().default("rustfs_user"),
    S3_BUCKET: z.string().default("curricula"),
    S3_ENDPOINT: z.url().default("http://localhost:9000"),
    S3_ENDPOINT_PUBLIC: z.url().default("http://localhost:9000"),
    S3_REGION: z.string().default("us-east-1"),
    S3_SECRET_KEY: z.string().default("rustfs_password_secure"),
    SQLSERVER_DATABASE: z.string().default("backend_db"),
    SQLSERVER_ENCRYPT: z
      .string()
      .transform((value) => value !== "false")
      .default(true),
    SQLSERVER_HOST: z.string().default("localhost"),
    SQLSERVER_PASSWORD: z.string(),
    SQLSERVER_PORT: z.string().transform(Number).default(1433),
    SQLSERVER_TRUST_SERVER_CERTIFICATE: z
      .string()
      .transform((value) => value === "true")
      .default(false),
    SQLSERVER_USER: z.string(),
    TRUSTED_PROXY_IPS: z.string().default(""),
  },
});
