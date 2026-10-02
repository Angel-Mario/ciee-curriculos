import { Module } from "@nestjs/common";

import { CandidatesController } from "./candidates.controller.js";
import { CandidatesService } from "./candidates.service.js";
import { PdfImportService } from "./pdf/pdf-import.service.js";

@Module({
  controllers: [CandidatesController],
  exports: [CandidatesService],
  providers: [CandidatesService, PdfImportService],
})
export class CandidatesModule {}
