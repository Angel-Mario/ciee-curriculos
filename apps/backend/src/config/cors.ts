import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface.js";

export function createCorsOptions(configuredOrigins: string): CorsOptions {
  if (configuredOrigins.trim() === "*") {
    return { origin: "*" };
  }

  const origins = configuredOrigins.split(",").map((value) => {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error(
        "CORS_ORIGIN must contain HTTP origins without paths or credentials."
      );
    }
    return url.origin;
  });

  return { origin: origins };
}
