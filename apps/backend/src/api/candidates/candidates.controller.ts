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
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse,
  ApiQuery,
  ApiServiceUnavailableResponse,
} from "@nestjs/swagger";
import type { Request as ExpressRequest } from "express";

import { CandidatesService } from "./candidates.service.js";
import type { CandidatePdf } from "./candidates.service.js";
import { CreateCandidateDto } from "./dto/create-candidate.dto.js";
import type { CreateCandidateInput } from "./dto/create-candidate.dto.js";
import { DeleteCandidatesDto } from "./dto/delete-candidates.dto.js";
import type { DeleteCandidatesInput } from "./dto/delete-candidates.dto.js";
import { ListCandidatesQueryDto } from "./dto/list-candidates-query.dto.js";
import { PdfImportService } from "./pdf/pdf-import.service.js";

const MAX_PDF_SIZE_BYTES = 5_000_000;
const MAX_SQL_SERVER_INT = 2_147_483_647;
const BRAZILIAN_PHONE_DESCRIPTION =
  "Brazilian phone with a valid DDD: 10 digits for landlines or 11 for mobile numbers starting with 9. Formatting and the optional +55 prefix are normalized to national digits.";

interface UploadedPdf {
  buffer: Buffer;
  originalname: string;
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
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fields: 5, fileSize: MAX_PDF_SIZE_BYTES, files: 1, parts: 6 },
    })
  )
  @ApiOperation({
    description:
      "Create a candidate. Use multipart/form-data to attach an optional PDF (maximum 5 MB), or application/json to submit fields without a file.",
    requestBody: {
      // Scalar selects the first media type; show the PDF picker by default.
      // eslint-disable-next-line sort-keys
      content: {
        "multipart/form-data": {
          schema: {
            properties: {
              email: { format: "email", maxLength: 254, type: "string" },
              file: {
                description: "Optional PDF, maximum 5 MB",
                format: "binary",
                type: "string",
              },
              fullName: { maxLength: 200, minLength: 1, type: "string" },
              interestArea: { maxLength: 200, type: "string" },
              phone: {
                description: BRAZILIAN_PHONE_DESCRIPTION,
                example: "41997429889",
                maxLength: 32,
                type: "string",
              },
              professionalSummary: { maxLength: 2000, type: "string" },
            },
            required: ["email", "fullName"],
            type: "object",
          },
        },
        "application/json": {
          schema: {
            properties: {
              email: { format: "email", maxLength: 254, type: "string" },
              fullName: { maxLength: 200, minLength: 1, type: "string" },
              interestArea: { maxLength: 200, nullable: true, type: "string" },
              phone: {
                description: BRAZILIAN_PHONE_DESCRIPTION,
                example: "41997429889",
                maxLength: 32,
                nullable: true,
                type: "string",
              },
              professionalSummary: {
                maxLength: 2000,
                nullable: true,
                type: "string",
              },
            },
            required: ["email", "fullName"],
            type: "object",
          },
        },
      },
      required: true,
    },
    summary: "/api/candidates",
  })
  @ApiCreatedResponse({ description: "Candidate created successfully" })
  @ApiConflictResponse({
    description: "Email already registered (EMAIL_ALREADY_IN_USE)",
  })
  @ApiBadRequestResponse({ description: "Candidate fields are invalid" })
  @ApiPayloadTooLargeResponse({ description: "PDF exceeds the 5 MB limit" })
  @ApiUnsupportedMediaTypeResponse({
    description: "Uploaded content is not a PDF",
  })
  @ApiServiceUnavailableResponse({
    description: "Storage unavailable (STORAGE_UNAVAILABLE)",
  })
  @ApiInternalServerErrorResponse({
    description: "Candidate could not be saved",
  })
  create(
    @Request() request: ExpressRequest,
    @Body() body: CreateCandidateInput,
    @UploadedFile() file: UploadedPdf | undefined
  ) {
    if (file && !file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new UnsupportedMediaTypeException({
        code: "INVALID_FILE_TYPE",
        message: "O conteúdo enviado não é um PDF válido.",
      });
    }
    const validationInput = request.is("multipart/form-data")
      ? request.body
      : body;
    const validation = CreateCandidateDto.schema.safeParse(validationInput);
    if (!validation.success) {
      throw new BadRequestException(validation.error.issues);
    }
    const parsedInput = validation.data;

    return this.candidatesService
      .create(
        parsedInput,
        file
          ? ({
              buffer: file.buffer,
              originalName: file.originalname,
              size: file.size,
            } satisfies CandidatePdf)
          : undefined
      )
      .then((candidate) => this.candidatesService.toResponse(candidate));
  }

  @Get()
  @ApiOperation({ summary: "/api/candidates" })
  @ApiQuery({
    description: "Busca ocorrências em nome ou e-mail (união dos resultados)",
    name: "q",
    required: false,
  })
  @ApiQuery({
    enum: ["id", "fullName", "email", "phone", "interestArea"],
    name: "sortBy",
    required: false,
  })
  @ApiQuery({ enum: ["asc", "desc"], name: "sortOrder", required: false })
  @ApiQuery({
    enum: ["all", "yes", "no"],
    name: "hasCurriculum",
    required: false,
  })
  @ApiQuery({ name: "interestArea", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  @ApiOkResponse({ description: "Candidates retrieved successfully" })
  @ApiInternalServerErrorResponse({
    description: "Candidates could not be retrieved",
  })
  findAll(@Query() query: Record<string, unknown>) {
    const validation = ListCandidatesQueryDto.schema.safeParse(query);
    if (!validation.success) {
      throw new BadRequestException(validation.error.issues);
    }
    return this.candidatesService.findAll(validation.data).then((result) => ({
      ...result,
      items: result.items.map((candidate) =>
        this.candidatesService.toListResponse(candidate)
      ),
    }));
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
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      properties: {
        file: {
          description: "PDF to extract suggestions from, maximum 5 MB",
          format: "binary",
          type: "string",
        },
      },
      required: ["file"],
      type: "object",
    },
  })
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

  @Get(":id/curriculum/download")
  @ApiOperation({ summary: "/api/candidates/{id}/curriculum/download" })
  @ApiOkResponse({
    description: "Curriculum download URL requested successfully",
    schema: {
      properties: { url: { format: "uri", type: "string" } },
      required: ["url"],
      type: "object",
    },
  })
  @ApiBadRequestResponse({ description: "Candidate ID is invalid" })
  @ApiNotFoundResponse({
    description: "Candidate or curriculum does not exist",
  })
  @ApiInternalServerErrorResponse({
    description: "Curriculum download URL could not be retrieved",
  })
  getCurriculumDownload(@Param("id", ParseIntPipe) id: number) {
    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_SQL_SERVER_INT) {
      throw new BadRequestException("Candidate ID must be a positive integer.");
    }

    return this.candidatesService.getCurriculumDownload(id);
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

    return this.candidatesService.toResponse(candidate);
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
