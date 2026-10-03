import { Logger, StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { Request, Response } from "express";

import { AppModule } from "./app.module.js";
import { createCorsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { createDocs } from "./docs/create-docs.js";

async function bootstrap() {
  const trustedProxyIps = env.TRUSTED_PROXY_IPS.split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  const app = await NestFactory.create(AppModule);
  if (trustedProxyIps.length > 0) {
    app.getHttpAdapter().getInstance().set("trust proxy", trustedProxyIps);
  }
  app.enableCors(createCorsOptions(env.CORS_ORIGIN));
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
  const docsPath = "/docs";
  const document = await createDocs(app);
  app
    .getHttpAdapter()
    .get("/openapi.json", (_request: Request, response: Response) =>
      response.json(document)
    );
  app.use(
    docsPath,
    apiReference({
      content: document,
      pageTitle: "CIEE Currículos API",
      theme: "default",
    })
  );
  Logger.log(
    `Swagger documentation available at http://localhost:${env.PORT}${docsPath}`,
    "SwaggerDocs"
  );
  await app.listen(env.PORT, "0.0.0.0");
  Logger.log(
    `Started backend server on http://localhost:${env.PORT}/api`,
    "Main"
  );
}
await bootstrap();
