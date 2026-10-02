import { Logger, StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { apiReference } from "@scalar/nestjs-api-reference";

import { AppModule } from "./app.module.js";
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
  app.enableCors({
    origin: env.CORS_ORIGIN,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
  const docsPath = "/docs";
  app.use(
    docsPath,
    apiReference({
      content: await createDocs(app, {
        description: "backend NestJS application",
        integrations: {
          zod: {
            withFastify: false,
          },
        },
        title: "Backend API",
        version: "1.0.0",
      }),

      pageTitle: "Backend API Docs",
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
