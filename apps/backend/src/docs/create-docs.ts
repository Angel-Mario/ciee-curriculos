import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";

export interface CreateDocsOptions {
  title?: string;
  description?: string;
  version?: string;
}
export function createDocs(
  app: INestApplication,
  options: CreateDocsOptions = {}
): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(options.title ?? "CIEE Currículos API")
    .setDescription(
      options.description ??
        "Candidate registration, queries and PDF curriculum import."
    )
    .setVersion(options.version ?? "1.0.0")
    .build();
  return SwaggerModule.createDocument(app, config);
}
