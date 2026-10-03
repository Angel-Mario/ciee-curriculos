import { Module } from "@nestjs/common";

import { S3Module } from "../../s3/s3.module.js";
import { CandidatesController } from "./candidates.controller.js";
import { CandidatesService } from "./candidates.service.js";
import { PdfImportService } from "./pdf/pdf-import.service.js";

@Module({
  controllers: [CandidatesController],
  exports: [CandidatesService],
  imports: [S3Module],
  providers: [CandidatesService, PdfImportService],
})
export class CandidatesModule {}
