import "dotenv/config";
import { INestApplication, StandardSchemaValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testDatabaseName = process.env.SQLSERVER_DATABASE;

if (!testDatabaseName?.toLowerCase().endsWith("_test")) {
  throw new Error(
    "Candidate e2e tests require SQLSERVER_DATABASE to name a dedicated database ending in _test."
  );
}

function makeTextPdf() {
  const stream =
    "BT /F1 12 Tf 72 720 Td (Nome completo: Ana Souza) Tj 0 -18 Td (ana@example.com) Tj 0 -18 Td (Telefone: 41999991234) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}

describe("Candidates API (e2e)", () => {
  let app: INestApplication;
  const createdIds: number[] = [];

  async function createCandidate(fullName: string) {
    const response = await request(app.getHttpServer())
      .post("/api/candidates")
      .send({ email: `${crypto.randomUUID()}@example.com`, fullName })
      .expect(201);
    const id = response.body.id as number;
    createdIds.push(id);
    return response.body as { id: number; fullName: string };
  }

  beforeAll(async () => {
    const { AppModule } = await import("../src/app.module.js");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  it("creates a candidate, lists it, and retrieves its details", async () => {
    const payload = {
      email: `${crypto.randomUUID()}@example.com`,
      fullName: "Ana Souza",
      interestArea: "Backend",
      phone: "41999991234",
      professionalSummary: "Experiência com Node.js.",
    };
    const created = await request(app.getHttpServer())
      .post("/api/candidates")
      .send(payload)
      .expect(201);
    const id = created.body.id as number;
    createdIds.push(id);

    expect(created.body).toMatchObject(payload);

    const listed = await request(app.getHttpServer())
      .get("/api/candidates")
      .expect(200);
    expect(listed.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id })])
    );

    const details = await request(app.getHttpServer())
      .get(`/api/candidates/${id}`)
      .expect(200);
    expect(details.body).toMatchObject({ id, ...payload });
  });

  it("rejects invalid data and invalid IDs", async () => {
    await request(app.getHttpServer())
      .post("/api/candidates")
      .send({ email: "bad-email", fullName: " " })
      .expect(400);
    await request(app.getHttpServer()).get("/api/candidates/0").expect(400);
    await request(app.getHttpServer())
      .get("/api/candidates/not-an-id")
      .expect(400);
  });

  it("deletes one candidate and returns 404 for a missing candidate", async () => {
    const candidate = await createCandidate("Delete one");

    await request(app.getHttpServer())
      .delete(`/api/candidates/${candidate.id}`)
      .expect(200, { id: candidate.id });
    await request(app.getHttpServer())
      .delete(`/api/candidates/${candidate.id}`)
      .expect(404);
  });

  it("deletes only the requested candidates in a bulk operation", async () => {
    const first = await createCandidate("Bulk delete one");
    const second = await createCandidate("Bulk delete two");

    await request(app.getHttpServer())
      .delete("/api/candidates")
      .send({ ids: [first.id, first.id, second.id, 2_147_483_647] })
      .expect(200, { deletedCount: 2 });

    await request(app.getHttpServer())
      .delete("/api/candidates")
      .send({ ids: [] })
      .expect(400);
  });

  it("extracts PDF suggestions without persisting a candidate", async () => {
    const before = await request(app.getHttpServer())
      .get("/api/candidates")
      .expect(200);
    const response = await request(app.getHttpServer())
      .post("/api/candidates/import-pdf")
      .attach("file", makeTextPdf(), {
        contentType: "application/pdf",
        filename: "resume.pdf",
      })
      .expect(200);

    expect(response.body.data).toEqual({
      email: "ana@example.com",
      fullName: "Ana Souza",
      phone: "41999991234",
    });
    const after = await request(app.getHttpServer())
      .get("/api/candidates")
      .expect(200);
    expect(after.body).toHaveLength(before.body.length);
  });

  it("rejects non-PDF uploads and PDFs it cannot read", async () => {
    await request(app.getHttpServer())
      .post("/api/candidates/import-pdf")
      .attach("file", Buffer.from("not a PDF"), "resume.pdf")
      .expect(415);

    await request(app.getHttpServer())
      .post("/api/candidates/import-pdf")
      .attach("file", Buffer.from("%PDF-malformed"), "broken.pdf")
      .expect(422);
  });

  it("rejects uploads larger than 5 MB", async () => {
    const oversizedPdf = Buffer.alloc(5_000_001, 0x20);
    Buffer.from("%PDF-").copy(oversizedPdf);

    await request(app.getHttpServer())
      .post("/api/candidates/import-pdf")
      .attach("file", oversizedPdf, "oversized.pdf")
      .expect(413);
  });

  afterAll(async () => {
    if (app && createdIds.length > 0) {
      await request(app.getHttpServer())
        .delete("/api/candidates")
        .send({ ids: createdIds });
    }
    await app?.close();
  });
});
