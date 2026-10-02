import { UnprocessableEntityException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PdfImportService } from "./pdf-import.service.js";

const parserMocks = vi.hoisted(() => ({
  destroy: vi.fn<() => Promise<void>>(),
  getText: vi.fn<() => Promise<{ text: string }>>(),
  instance: vi.fn<() => void>(),
}));

vi.mock(import("pdf-parse"), () => ({
  PDFParse: class {
    constructor() {
      parserMocks.instance();
    }

    destroy = parserMocks.destroy;

    getText = parserMocks.getText;
  } as unknown as typeof import("pdf-parse").PDFParse,
}));

describe("PDF import workflow", () => {
  const service = new PdfImportService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts suggestions and releases the parser", async () => {
    parserMocks.getText.mockResolvedValue({
      text: "Nome: Ana Souza\nana@example.com",
    });

    await expect(service.import(Buffer.from("pdf"))).resolves.toMatchObject({
      data: { email: "ana@example.com", fullName: "Ana Souza", phone: null },
      missingFields: ["phone"],
    });
    expect(parserMocks.instance).toHaveBeenCalledOnce();
    expect(parserMocks.destroy).toHaveBeenCalledOnce();
  });

  it("turns parser errors into a manual-entry-friendly 422 and still releases resources", async () => {
    parserMocks.getText.mockRejectedValue(new Error("Malformed PDF"));

    await expect(service.import(Buffer.from("pdf"))).rejects.toBeInstanceOf(
      UnprocessableEntityException
    );
    expect(parserMocks.destroy).toHaveBeenCalledOnce();
  });
});
