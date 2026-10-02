import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PDFParse } from "pdf-parse";

import { extractCandidateFields } from "./extract-candidate-fields.js";

@Injectable()
export class PdfImportService {
  async import(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return extractCandidateFields(result.text);
    } catch {
      throw new UnprocessableEntityException({
        code: "PDF_READ_FAILED",
        message:
          "Não foi possível ler este PDF. Você ainda pode preencher o cadastro manualmente.",
      });
    } finally {
      await parser.destroy();
    }
  }
}
