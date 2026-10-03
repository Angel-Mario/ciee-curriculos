import type {
  Candidate,
  CreateCandidateInput,
  PdfImportResult,
  ListCandidatesQuery,
  CandidatePage,
} from "@ciee-curriculos/shared";
import {
  candidatePageSchema,
  createCandidateSchema,
  curriculumDownloadSchema,
} from "@ciee-curriculos/shared";
import { z } from "zod";

import { env } from "@/env";

export type {
  Candidate,
  Curriculum,
  PdfImportResult,
} from "@ciee-curriculos/shared";

export interface CandidateInput {
  fullName: string;
  email: string;
  phone: string;
  interestArea: string;
  professionalSummary: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE = `${env.VITE_SERVER_URL.replace(/\/+$/u, "")}/api`;

const apiErrorMessageSchema = z.union([
  z.string().min(1),
  z.array(z.union([z.string(), z.object({ message: z.string() })])),
]);

function readErrorMessage(body: unknown): string | undefined {
  const envelope = z.object({ message: apiErrorMessageSchema }).safeParse(body);
  const parsed = envelope.success
    ? envelope.data.message
    : apiErrorMessageSchema.safeParse(body).data;
  if (typeof parsed === "string") {
    return parsed;
  }
  return (
    parsed
      ?.map((issue) => (typeof issue === "string" ? issue : issue.message))
      .join(" ") || undefined
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `A solicitação falhou (${response.status}).`;
    try {
      message = readErrorMessage(await response.json()) ?? message;
    } catch {
      // Keep the HTTP status message when the response has no JSON body.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function listCandidates(
  query: ListCandidatesQuery,
  signal?: AbortSignal
): Promise<CandidatePage> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "all") {
      search.set(key, String(value));
    }
  }
  const rawPage = await request<unknown>(`candidates?${search.toString()}`, {
    signal,
  });
  return candidatePageSchema.parse(rawPage);
}

export function getCandidate(
  id: number,
  signal?: AbortSignal
): Promise<Candidate> {
  return request<Candidate>(`candidates/${id}`, { signal });
}

export function createCandidate(
  input: CreateCandidateInput,
  file?: File
): Promise<Candidate> {
  const normalizedInput = createCandidateSchema.parse(input);
  let body: BodyInit;
  if (file) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(normalizedInput)) {
      if (value !== null) {
        formData.set(key, value);
      }
    }
    formData.set("file", file);
    body = formData;
  } else {
    body = JSON.stringify(normalizedInput);
  }

  return request<Candidate>("candidates", {
    body,
    method: "POST",
  });
}

export async function getCurriculumDownloadUrl(id: number): Promise<string> {
  const rawResult = await request<unknown>(
    `candidates/${id}/curriculum/download`
  );
  const result = curriculumDownloadSchema.parse(rawResult);
  const url = new URL(result.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError("A URL de download recebida é inválida.", 502);
  }
  return result.url;
}

export function deleteCandidate(id: number): Promise<void> {
  return request(`candidates/${id}`, { method: "DELETE" });
}

export function importPdf(
  file: File,
  signal?: AbortSignal
): Promise<PdfImportResult> {
  const body = new FormData();
  body.set("file", file);
  return request<PdfImportResult>("candidates/import-pdf", {
    body,
    method: "POST",
    signal,
  });
}

export function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatFileSize(sizeBytes: number): string {
  let unit = "byte";
  let divisor = 1;
  if (sizeBytes >= 1_000_000) {
    unit = "megabyte";
    divisor = 1_000_000;
  } else if (sizeBytes >= 1000) {
    unit = "kilobyte";
    divisor = 1000;
  }
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    style: "unit",
    unit,
    unitDisplay: "short",
  }).format(sizeBytes / divisor);
}

export function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
}

export const interestAreas = [
  "Administração",
  "Análise de Dados",
  "Arquitetura e Urbanismo",
  "Assistente Administrativo",
  "Atendimento ao Cliente",
  "Auxiliar de Produção",
  "Biomedicina",
  "Ciências Contábeis",
  "Comércio Exterior",
  "Compras",
  "Comunicação e Jornalismo",
  "Departamento Pessoal",
  "Desenvolvimento Backend",
  "Desenvolvimento de Sistemas",
  "Desenvolvimento Frontend",
  "Desenvolvimento Full Stack",
  "Design",
  "Design de Interfaces (UI/UX)",
  "Direito",
  "Educação Física",
  "Enfermagem",
  "Engenharia Ambiental",
  "Engenharia Civil",
  "Engenharia de Produção",
  "Engenharia Elétrica",
  "Engenharia Mecânica",
  "Farmácia",
  "Finanças",
  "Fisioterapia",
  "Gastronomia",
  "Gestão de Projetos",
  "Gestão Pública",
  "Logística",
  "Marketing",
  "Nutrição",
  "Pedagogia",
  "Psicologia",
  "Qualidade",
  "Recepção",
  "Recursos Humanos",
  "Redes e Infraestrutura",
  "Secretariado",
  "Segurança da Informação",
  "Segurança do Trabalho",
  "Serviço Social",
  "Suporte Técnico",
  "Técnico em Informática",
  "Turismo e Hotelaria",
  "Vendas",
  "Veterinária",
];
