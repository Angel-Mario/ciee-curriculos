import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";

interface DocsIntegrations {
  betterAuth?: {
    auth?: unknown;
    pathPrefix?: string;
    prefix?: string;
  };
  trpc?: {
    exportName?: string;
    pathPrefix?: string;
    routerFilePath?: string;
    title?: string;
    version?: string;
  };
  zod?: {
    withFastify?: boolean;
  };
  bearerAuth?: boolean;
}

export interface CreateDocsOptions {
  title?: string;
  description?: string;
  version?: string;
  extraSpecs?: OpenAPIObject[];
  integrations?: DocsIntegrations;
}

function addPrefixToPaths(paths: Record<string, unknown>, prefix: string) {
  return Object.fromEntries(
    Object.entries(paths).map(([path, value]) => [`${prefix}${path}`, value])
  );
}

function mergeOpenApiSpecs(
  baseSpec: OpenAPIObject,
  ...extraSpecs: OpenAPIObject[]
) {
  const specs = [baseSpec, ...extraSpecs];

  return {
    ...baseSpec,
    components: {
      ...baseSpec.components,
      parameters: Object.assign(
        {},
        ...specs.map((spec) => spec.components?.parameters ?? {})
      ),
      responses: Object.assign(
        {},
        ...specs.map((spec) => spec.components?.responses ?? {})
      ),
      schemas: Object.assign(
        {},
        ...specs.map((spec) => spec.components?.schemas ?? {})
      ),
      securitySchemes: Object.assign(
        {},
        ...specs.map((spec) => spec.components?.securitySchemes ?? {})
      ),
    },
    info: baseSpec.info,
    openapi: baseSpec.openapi ?? "3.1.0",
    paths: Object.assign({}, ...specs.map((spec) => spec.paths ?? {})),
    security: specs.find((spec) => spec.security)?.security,
    servers: baseSpec.servers,
    tags: specs.flatMap((spec) => (spec.tags ?? []) as unknown[]),
  } as OpenAPIObject;
}

async function applyZodCleanup(
  baseSpec: OpenAPIObject,
  options?: NonNullable<DocsIntegrations["zod"]>
) {
  try {
    const packageName = "nestjs-zod";
    const { cleanupOpenApiDoc } = await import(packageName);
    if (typeof cleanupOpenApiDoc !== "function") {
      return baseSpec;
    }

    if (options?.withFastify === true) {
      return cleanupOpenApiDoc(baseSpec, {
        withFastify: true,
      }) as OpenAPIObject;
    }

    return cleanupOpenApiDoc(baseSpec) as OpenAPIObject;
  } catch {
    return baseSpec;
  }
}

async function applyBetterAuthSpec(
  options?: NonNullable<DocsIntegrations["betterAuth"]>
) {
  if (!options?.auth) {
    return null;
  }

  const authInstance = options.auth as {
    api?: {
      generateOpenAPISchema?: () => OpenAPIObject | Promise<OpenAPIObject>;
    };
    generateOpenAPISchema?: () => OpenAPIObject | Promise<OpenAPIObject>;
  };

  const schemaGenerator =
    authInstance.api?.generateOpenAPISchema ??
    authInstance.generateOpenAPISchema;

  if (typeof schemaGenerator !== "function") {
    return null;
  }

  try {
    const generatedSchema = await schemaGenerator();
    const authSpec = generatedSchema as OpenAPIObject;
    const prefix = options.pathPrefix ?? options.prefix ?? "/auth";

    if (authSpec.paths) {
      authSpec.paths = addPrefixToPaths(
        authSpec.paths as Record<string, unknown>,
        prefix
      ) as unknown as OpenAPIObject["paths"];
    }

    return authSpec;
  } catch {
    return null;
  }
}

async function applyTrpcSpec(options?: NonNullable<DocsIntegrations["trpc"]>) {
  if (!options?.routerFilePath) {
    return null;
  }

  try {
    const packageName = "@trpc/openapi";
    const { generateOpenAPIDocument } = await import(packageName);

    if (typeof generateOpenAPIDocument !== "function") {
      return null;
    }

    const generatedDocument = await generateOpenAPIDocument(
      options.routerFilePath,
      {
        exportName: options.exportName ?? "AppRouter",
        title: options.title ?? "tRPC API",
        version: options.version ?? "1.0.0",
      }
    );

    const trpcSpec = generatedDocument as OpenAPIObject;
    const prefix = options.pathPrefix ?? "/trpc";

    if (trpcSpec.paths) {
      trpcSpec.paths = addPrefixToPaths(
        trpcSpec.paths as Record<string, unknown>,
        prefix
      ) as unknown as OpenAPIObject["paths"];
    }

    return trpcSpec;
  } catch {
    return null;
  }
}

export async function createDocs(
  app: INestApplication,
  options: CreateDocsOptions = {}
): Promise<OpenAPIObject> {
  const builder = new DocumentBuilder()
    .setTitle(options.title ?? "NestJS API")
    .setDescription(options.description ?? "Generated with Nest Arch")
    .setVersion(options.version ?? "1.0.0");

  if (options.integrations?.bearerAuth === true) {
    builder.addBearerAuth();
  }

  const config = builder.build();

  let baseSpec = SwaggerModule.createDocument(app, config) as OpenAPIObject;
  baseSpec = await applyZodCleanup(baseSpec, options.integrations?.zod);

  if (!baseSpec.paths || Object.keys(baseSpec.paths).length === 0) {
    baseSpec = {
      ...baseSpec,
      info: baseSpec.info ?? {
        title: options.title ?? "NestJS API",
        version: options.version ?? "1.0.0",
      },
      openapi: baseSpec.openapi ?? "3.1.0",
      paths: {},
      tags: [],
    } as OpenAPIObject;
  }

  const additionalSpecs: OpenAPIObject[] = [];

  const betterAuthSpec = await applyBetterAuthSpec(
    options.integrations?.betterAuth
  );
  if (betterAuthSpec) {
    additionalSpecs.push(betterAuthSpec);
  }

  const trpcSpec = await applyTrpcSpec(options.integrations?.trpc);
  if (trpcSpec) {
    additionalSpecs.push(trpcSpec);
  }

  return mergeOpenApiSpecs(baseSpec, ...additionalSpecs);
}
