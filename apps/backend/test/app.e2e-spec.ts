import { INestApplication, StandardSchemaValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { apiReference } from "@scalar/nestjs-api-reference";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDocs } from "../src/docs/create-docs.js";
import { AppModule } from "./../src/app.module.js";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let generatedOpenApi: Awaited<ReturnType<typeof createDocs>>;

  async function startApplication() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    generatedOpenApi = await createDocs(app, {
      integrations: {
        zod: { withFastify: false },
      },
      title: "Generated API",
    });
    app.use(
      "/docs",
      apiReference({
        content: generatedOpenApi,

        theme: "default",
      })
    );
    await app.init();
  }
  beforeAll(startApplication);

  it("generates authenticated OpenAPI docs and serves the Scalar reference", async () => {
    expect(generatedOpenApi.openapi).toMatch(/^3\./u);
    expect(generatedOpenApi.paths?.["/todos"]?.post?.requestBody).toBeDefined();
    const reference = await request(app.getHttpServer())
      .get("/docs")
      .expect(200);
    expect(reference.text).toMatch(/scalar/u);
  });

  it("/ (GET)", async () => {
    const response = await request(app.getHttpServer()).get("/").expect(200);
    expect(response.text).toBe("Hello World!");
  });

  it("documents PDF upload as multipart binary and excludes files from JSON", () => {
    const operation = generatedOpenApi.paths["/candidates"]?.post;
    const body = operation?.requestBody;
    if (!body || "$ref" in body) {
      throw new Error("Candidate request body must be documented inline.");
    }
    expect(Object.keys(body.content)[0]).toBe("multipart/form-data");
    expect(body.content["multipart/form-data"]?.schema).toMatchObject({
      properties: { file: { format: "binary", type: "string" } },
      required: ["email", "fullName"],
    });
    const jsonSchema = body.content["application/json"]?.schema;
    expect(jsonSchema).not.toHaveProperty("properties.file");
    expect(operation?.responses).toHaveProperty("413");
    expect(operation?.responses).toHaveProperty("415");
    expect(operation?.responses).toHaveProperty("503");
  });

  it("returns 404 for an unknown route", async () => {
    await request(app.getHttpServer()).get("/__missing_route__").expect(404);
  });

  it("persists, updates and deletes a todo through HTTP", async () => {
    const created = await request(app.getHttpServer())
      .post("/todos")
      .send({ completed: false, title: "Database integration" })
      .expect(201);
    const { id } = created.body;
    expect(id).toBeTruthy();
    const listed = await request(app.getHttpServer()).get("/todos").expect(200);
    expect(listed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id, title: "Database integration" }),
      ])
    );
    await request(app.getHttpServer())
      .put(`/todos/${id}`)
      .send({ completed: true })
      .expect(200);
    const updated = await request(app.getHttpServer())
      .get("/todos")
      .expect(200);
    expect(updated.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ completed: true, id })])
    );
    await request(app.getHttpServer()).delete(`/todos/${id}`).expect(200);
    const deleted = await request(app.getHttpServer())
      .get("/todos")
      .expect(200);
    expect(deleted.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id })])
    );
  });

  it("rejects unsupported methods", async () => {
    await request(app.getHttpServer())
      .post("/")
      .send({ unexpected: true })
      .expect(404);
  });

  afterAll(async () => {
    await app?.close();
  });
});
