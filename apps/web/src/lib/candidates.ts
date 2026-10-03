import type {
  Candidate,
  CreateCandidateInput,
  PdfImportResult,
  ListCandidatesQuery,
  CandidatePage,
} from "@ciee-curriculos/shared";
import { candidatePageSchema } from "@ciee-curriculos/shared";

import { env } from "@/env";
import { compareCandidates } from "@/lib/candidate-sort";

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

const API_BASE = env.VITE_SERVER_URL.replace(/\/+$/u, "");
const MOCK_MODE_KEY = "ciee-candidates-mock-mode";
const MOCK_CANDIDATES_KEY = "ciee-candidates-mock-data";

const sampleCandidates: Candidate[] = [
  {
    createdAt: "2025-09-28T14:32:00.000-03:00",
    curriculum: {
      id: 1,
      originalName: "curriculo_ana_carolina.pdf",
      sizeBytes: 1_200_000,
      uploadedAt: "2025-09-28T14:32:00.000-03:00",
    },
    email: "ana.silva@email.com",
    fullName: "Ana Carolina Silva",
    hasCurriculum: true,
    id: 1,
    interestArea: "Desenvolvimento de Sistemas",
    phone: "(41) 98765-4321",
    professionalSummary:
      "Desenvolvedora com 3 anos de experiência em desenvolvimento web, com foco em JavaScript, React e Node.js.",
  },
  {
    createdAt: "2025-09-27T10:15:00.000Z",
    curriculum: null,
    email: "bruno.oliveira@email.com",
    fullName: "Bruno Oliveira",
    hasCurriculum: true,
    id: 2,
    interestArea: "Suporte Técnico",
    phone: "(41) 91234-5678",
    professionalSummary:
      "Profissional de suporte com experiência em atendimento, manutenção e infraestrutura.",
  },
  {
    createdAt: "2025-09-26T16:20:00.000Z",
    curriculum: null,
    email: "camila.santos@email.com",
    fullName: "Camila Santos",
    hasCurriculum: false,
    id: 3,
    interestArea: "Análise de Dados",
    phone: "(41) 99876-5432",
    professionalSummary:
      "Analista de dados com domínio de SQL, Power BI e criação de indicadores para o negócio.",
  },
  {
    createdAt: "2025-09-25T09:45:00.000Z",
    curriculum: null,
    email: "daniel.pereira@email.com",
    fullName: "Daniel Pereira",
    hasCurriculum: true,
    id: 4,
    interestArea: "Desenvolvimento Frontend",
    phone: "(41) 95555-1212",
    professionalSummary:
      "Desenvolvedor frontend com experiência em interfaces acessíveis e aplicações React.",
  },
  {
    createdAt: "2025-09-24T11:10:00.000Z",
    curriculum: null,
    email: "fernanda.lima@email.com",
    fullName: "Fernanda Lima",
    hasCurriculum: false,
    id: 5,
    interestArea: "Gestão de Projetos",
    phone: "(41) 97777-3333",
    professionalSummary:
      "Gerente de projetos com atuação em times multidisciplinares e metodologias ágeis.",
  },
  {
    createdAt: "2025-09-23T13:25:00.000Z",
    curriculum: null,
    email: "gabriel.costa@email.com",
    fullName: "Gabriel Costa",
    hasCurriculum: true,
    id: 6,
    interestArea: "Desenvolvimento de Sistemas",
    phone: "(41) 98888-1010",
    professionalSummary:
      "Estudante de sistemas de informação e desenvolvedor júnior.",
  },
  {
    createdAt: "2025-09-22T08:50:00.000Z",
    curriculum: null,
    email: "helena.martins@email.com",
    fullName: "Helena Martins",
    hasCurriculum: false,
    id: 7,
    interestArea: "Recursos Humanos",
    phone: "(41) 94444-6789",
    professionalSummary:
      "Analista de RH com experiência em recrutamento e desenvolvimento de pessoas.",
  },
  {
    createdAt: "2025-09-21T15:05:00.000Z",
    curriculum: null,
    email: "igor.rodrigues@email.com",
    fullName: "Igor Rodrigues",
    hasCurriculum: true,
    id: 8,
    interestArea: "Suporte Técnico",
    phone: "(41) 93333-2211",
    professionalSummary:
      "Técnico em informática e suporte a usuários corporativos.",
  },
  {
    createdAt: "2025-09-20T12:40:00.000Z",
    curriculum: null,
    email: "julia.almeida@email.com",
    fullName: "Julia Almeida",
    hasCurriculum: false,
    id: 9,
    interestArea: "Análise de Dados",
    phone: "(41) 92222-5544",
    professionalSummary:
      "Analista com foco em dados, relatórios e automação de processos.",
  },
  {
    createdAt: "2025-09-19T10:20:00.000Z",
    curriculum: null,
    email: "lucas.ferreira@email.com",
    fullName: "Lucas Ferreira",
    hasCurriculum: true,
    id: 10,
    interestArea: "Design",
    phone: "(41) 91111-8899",
    professionalSummary:
      "Designer de produto com foco em pesquisa e experiência digital.",
  },
  {
    createdAt: "2025-09-18T09:30:00.000Z",
    curriculum: null,
    email: "mariana.souza@email.com",
    fullName: "Mariana Souza",
    hasCurriculum: false,
    id: 11,
    interestArea: "Gestão de Projetos",
    phone: "(41) 90000-4321",
    professionalSummary: "Coordenadora de projetos e operações.",
  },
  {
    createdAt: "2025-09-17T17:15:00.000Z",
    curriculum: null,
    email: "rafael.mendes@email.com",
    fullName: "Rafael Mendes",
    hasCurriculum: true,
    id: 12,
    interestArea: "Desenvolvimento Frontend",
    phone: "(41) 98989-7766",
    professionalSummary:
      "Desenvolvedor focado em aplicações web e design systems.",
  },
];

function isMockMode(): boolean {
  return window.localStorage.getItem(MOCK_MODE_KEY) === "true";
}

function setMockMode(enabled: boolean): void {
  window.localStorage.setItem(MOCK_MODE_KEY, String(enabled));
}

function getMockCandidates(): Candidate[] {
  const savedCandidates = window.localStorage.getItem(MOCK_CANDIDATES_KEY);
  if (!savedCandidates) {
    return sampleCandidates;
  }

  try {
    return JSON.parse(savedCandidates) as Candidate[];
  } catch {
    window.localStorage.removeItem(MOCK_CANDIDATES_KEY);
    return sampleCandidates;
  }
}

function saveMockCandidates(candidates: Candidate[]): void {
  window.localStorage.setItem(MOCK_CANDIDATES_KEY, JSON.stringify(candidates));
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
      const body = (await response.json()) as {
        message?: string | string[];
      };
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(" ")
          : body.message;
      }
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
): Promise<
  CandidatePage & {
    usingMockData: boolean;
  }
> {
  try {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "all") {
        search.set(key, String(value));
      }
    }
    const rawPage = await request<unknown>(`candidates?${search.toString()}`, {
      signal,
    });
    const page = candidatePageSchema.parse(rawPage);
    setMockMode(false);
    return { ...page, usingMockData: false };
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    setMockMode(true);
    const allCandidates = getMockCandidates();
    const normalizedQuery = query.q?.toLocaleLowerCase("pt-BR");
    const filteredCandidates = allCandidates
      .filter((candidate) =>
        normalizedQuery
          ? [candidate.fullName, candidate.email].some((value) =>
              value.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
            )
          : true
      )
      .filter((candidate) =>
        query.interestArea
          ? candidate.interestArea
              ?.toLocaleLowerCase("pt-BR")
              .includes(query.interestArea.toLocaleLowerCase("pt-BR"))
          : true
      )
      .filter((candidate) =>
        query.hasCurriculum === "all"
          ? true
          : Boolean(candidate.hasCurriculum) === (query.hasCurriculum === "yes")
      )
      .toSorted((first, second) =>
        compareCandidates(
          first,
          second,
          query.sortBy,
          query.sortOrder === "asc"
        )
      );
    const start = (query.page - 1) * query.pageSize;
    const items = filteredCandidates.slice(start, start + query.pageSize);
    return {
      items,
      page: query.page,
      pageCount: Math.ceil(filteredCandidates.length / query.pageSize),
      pageSize: query.pageSize,
      total: filteredCandidates.length,
      usingMockData: true,
    };
  }
}

export function getCandidate(
  id: number,
  signal?: AbortSignal
): Promise<Candidate> {
  if (isMockMode()) {
    const candidate = getMockCandidates().find((item) => item.id === id);
    if (!candidate) {
      return Promise.reject(new ApiError("Candidato não encontrado.", 404));
    }
    return Promise.resolve(candidate);
  }
  return request<Candidate>(`candidates/${id}`, { signal });
}

export function createCandidate(
  input: CandidateInput & CreateCandidateInput,
  file?: File
): Promise<Candidate> {
  if (isMockMode()) {
    const candidates = getMockCandidates();
    const candidate: Candidate = {
      ...input,
      createdAt: new Date().toISOString(),
      curriculum: file
        ? {
            id: Date.now(),
            originalName: file.name,
            sizeBytes: file.size,
            uploadedAt: new Date().toISOString(),
          }
        : null,
      hasCurriculum: Boolean(file),
      id:
        Math.max(0, ...candidates.map(({ id: candidateId }) => candidateId)) +
        1,
    };
    saveMockCandidates([candidate, ...candidates]);
    return Promise.resolve(candidate);
  }

  let body: BodyInit;
  if (file) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(input)) {
      formData.set(key, value);
    }
    formData.set("file", file);
    body = formData;
  } else {
    body = JSON.stringify(input);
  }

  return request<Candidate>("candidates", {
    body,
    method: "POST",
  });
}

export async function getCurriculumDownloadUrl(id: number): Promise<string> {
  if (isMockMode()) {
    throw new ApiError(
      "O download não está disponível nos dados de demonstração.",
      404
    );
  }
  const result = await request<{ url: string }>(
    `candidates/${id}/curriculum/download`
  );
  return result.url;
}

export function deleteCandidate(id: number): Promise<void> {
  if (isMockMode()) {
    saveMockCandidates(
      getMockCandidates().filter((candidate) => candidate.id !== id)
    );
    return Promise.resolve();
  }
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

export function resetMockData(): void {
  window.localStorage.removeItem(MOCK_CANDIDATES_KEY);
  window.localStorage.removeItem(MOCK_MODE_KEY);
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
