import { spawn } from "node:child_process";
import { once } from "node:events";

import "dotenv/config";

const database = process.env.SQLSERVER_TEST_DATABASE ?? "backend_db_test";
if (!database.toLowerCase().endsWith("_test")) {
  throw new Error("SQLSERVER_TEST_DATABASE must end in _test.");
}

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) {
  throw new Error("Run this script through pnpm test:e2e.");
}

const environment = {
  ...process.env,
  NODE_ENV: "test",
  SQLSERVER_DATABASE: database,
};

async function run(args) {
  const child = spawn(process.execPath, [pnpmCli, ...args], {
    env: environment,
    stdio: "inherit",
  });
  const [code] = await once(child, "exit");
  if (code !== 0) {
    throw new Error(`E2E command failed with exit code ${code}.`);
  }
}

await run(["exec", "prisma", "migrate", "deploy"]);
await run(["run", "build"]);
await run([
  "exec",
  "vitest",
  "run",
  "--config",
  "./vitest.config.e2e.ts",
  ...process.argv.slice(2),
]);
