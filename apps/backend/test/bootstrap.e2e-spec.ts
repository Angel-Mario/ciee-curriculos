import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

import { afterEach, expect, it } from "vitest";

const startedProcesses: ChildProcess[] = [];

async function getFreePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  server.close();
  if (!address || typeof address === "string") {
    throw new Error(
      "Could not allocate a loopback port for the bootstrap test."
    );
  }
  return address.port;
}

async function waitForServer(
  url: string,
  application: ChildProcess,
  deadline = Date.now() + 60_000
): Promise<Response> {
  if (application.exitCode !== null) {
    throw new Error(
      `Generated application exited during startup with code ${application.exitCode}.`
    );
  }
  try {
    return await fetch(url, { signal: AbortSignal.timeout(500) });
  } catch (error) {
    if (Date.now() >= deadline) {
      throw new Error("Generated application did not become ready", {
        cause: error,
      });
    }
    await delay(100);
    return waitForServer(url, application, deadline);
  }
}

async function stopApplication(application: ChildProcess): Promise<void> {
  if (application.exitCode !== null) {
    return;
  }
  const exited = once(application, "exit");
  application.kill();
  const timeout = setTimeout(() => {
    application.kill("SIGKILL");
  }, 5000);
  try {
    await exited;
  } finally {
    clearTimeout(timeout);
  }
}

afterEach(async () => {
  await Promise.all(startedProcesses.splice(0).map(stopApplication));
});

it("boots the compiled application through main.ts", async () => {
  const port = await getFreePort();
  const origin = "https://allowed.example";
  const application = spawn(process.execPath, ["dist/main.js"], {
    env: {
      ...process.env,
      CORS_ORIGIN: origin,
      NODE_ENV: "test",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  startedProcesses.push(application);
  let output = "";
  application.stdout?.on("data", (chunk) => {
    output += chunk.toString();
  });
  application.stderr?.on("data", (chunk) => {
    output += chunk.toString();
  });

  const response = await waitForServer(
    `http://127.0.0.1:${port}/api`,
    application
  ).catch((error) => {
    throw new Error(`${error}\n${output}`);
  });
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("Hello World!");

  const corsResponse = await fetch(`http://127.0.0.1:${port}/api`, {
    headers: { Origin: origin },
  });
  expect(corsResponse.headers.get("access-control-allow-origin")).toBe(origin);
  const rootResponse = await fetch(`http://127.0.0.1:${port}/`, {
    redirect: "manual",
  });
  expect(rootResponse.status).toBe(404);
}, 65_000);
