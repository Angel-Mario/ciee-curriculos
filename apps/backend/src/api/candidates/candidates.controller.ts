import {
  BadRequestException,
  HttpCode,
  HttpStatus,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse,
} from "@nestjs/swagger";

import { CandidatesService } from "./candidates.service.js";
import { CreateCandidateDto } from "./dto/create-candidate.dto.js";
import type { CreateCandidateInput } from "./dto/create-candidate.dto.js";
import { DeleteCandidatesDto } from "./dto/delete-candidates.dto.js";
import type { DeleteCandidatesInput } from "./dto/delete-candidates.dto.js";
import { PdfImportService } from "./pdf/pdf-import.service.js";

const MAX_PDF_SIZE_BYTES = 5_000_000;
const MAX_SQL_SERVER_INT = 2_147_483_647;

interface UploadedPdf {
  buffer: Buffer;
  size: number;
}

@ApiTags("Candidates")
@Controller("candidates")
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly pdfImportService: PdfImportService
  ) {}

  @Post()
  @ApiOperation({ summary: "/api/candidates" })
  @ApiCreatedResponse({ description: "Candidate created successfully" })
  @ApiBadRequestResponse({ description: "Candidate fields are invalid" })
  @ApiInternalServerErrorResponse({
    description: "Candidate could not be saved",
  })
  create(
    @Body({ schema: CreateCandidateDto.schema }) input: CreateCandidateInput
  ) {
    return this.candidatesService.create(input);
  }

  @Get()
  @ApiOperation({ summary: "/api/candidates" })
  @ApiOkResponse({ description: "Candidates retrieved successfully" })
  @ApiInternalServerErrorResponse({
    description: "Candidates could not be retrieved",
  })
  findAll() {
    return this.candidatesService.findAll();
  }

  @Delete()
  @ApiOperation({ summary: "/api/candidates" })
  @ApiOkResponse({
    description: "Candidates deleted; returns the deleted count",
  })
  @ApiBadRequestResponse({
    description: "IDs must contain 1 to 100 valid candidate IDs",
  })
  @ApiInternalServerErrorResponse({
    description: "Candidates could not be deleted",
  })
  async deleteMany(
    @Body({ schema: DeleteCandidatesDto.schema }) input: DeleteCandidatesInput
  ) {
    const result = await this.candidatesService.deleteMany(input.ids);
    return { deletedCount: result.count };
  }

  @Post("import-pdf")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fields: 0, fileSize: MAX_PDF_SIZE_BYTES, files: 1, parts: 1 },
    })
  )
  @ApiOperation({ summary: "/api/candidates/import-pdf" })
  @ApiOkResponse({ description: "Extracted suggestions for manual review" })
  @ApiBadRequestResponse({
    description: "File is missing, too large, or multipart data is invalid",
  })
  @ApiPayloadTooLargeResponse({ description: "PDF exceeds the 5 MB limit" })
  @ApiUnsupportedMediaTypeResponse({
    description: "Uploaded content is not a PDF",
  })
  @ApiUnprocessableEntityResponse({ description: "PDF could not be read" })
  @ApiInternalServerErrorResponse({ description: "Unexpected import failure" })
  importPdf(@UploadedFile() file: UploadedPdf | undefined) {
    if (!file) {
      throw new BadRequestException({
        code: "FILE_REQUIRED",
        message: "Selecione um arquivo PDF para importar.",
      });
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      throw new PayloadTooLargeException({
        code: "PDF_TOO_LARGE",
        message: "O PDF deve ter no máximo 5 MB.",
      });
    }
    if (!file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new UnsupportedMediaTypeException({
        code: "INVALID_FILE_TYPE",
        message: "O conteúdo enviado não é um PDF válido.",
      });
    }

    return this.pdfImportService.import(file.buffer);
  }

  @Get(":id")
  @ApiOperation({ summary: "/api/candidates/{id}" })
  @ApiOkResponse({ description: "Candidate retrieved successfully" })
  @ApiBadRequestResponse({ description: "Candidate ID is invalid" })
  @ApiNotFoundResponse({ description: "Candidate does not exist" })
  @ApiInternalServerErrorResponse({
    description: "Candidate could not be retrieved",
  })
  async findById(@Param("id", ParseIntPipe) id: number) {
    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_SQL_SERVER_INT) {
      throw new BadRequestException("Candidate ID must be a positive integer.");
    }

    const candidate = await this.candidatesService.findById(id);
    if (!candidate) {
      throw new NotFoundException(`Candidate ${id} was not found.`);
    }

    return candidate;
  }

  @Delete(":id")
  @ApiOperation({ summary: "/api/candidates/{id}" })
  @ApiOkResponse({ description: "Candidate deleted successfully" })
  @ApiBadRequestResponse({ description: "Candidate ID is invalid" })
  @ApiNotFoundResponse({ description: "Candidate does not exist" })
  @ApiInternalServerErrorResponse({
    description: "Candidate could not be deleted",
  })
  async deleteById(@Param("id", ParseIntPipe) id: number) {
    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_SQL_SERVER_INT) {
      throw new BadRequestException("Candidate ID must be a positive integer.");
    }

    const result = await this.candidatesService.deleteById(id);
    if (result.count === 0) {
      throw new NotFoundException(`Candidate ${id} was not found.`);
    }

    return { id };
  }
}
