import { parseListCandidatesQuery } from "@ciee-curriculos/shared";
import { toast } from "@ciee-curriculos/ui/components/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  FileText,
  Mail,
  Phone,
} from "lucide-react";
import { useEffect } from "react";

import { CandidateDetailSkeleton } from "@/components/candidate-loading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { candidateDetailOptions } from "@/lib/candidate-queries";
import {
  formatDate,
  formatFileSize,
  getCurriculumDownloadUrl,
  getInitials,
} from "@/lib/candidates";

export const Route = createFileRoute("/candidates/$candidateId")({
  component: CandidateDetailRoute,
  head: () => ({ meta: [{ title: "Detalhes do candidato | CIEE/PR" }] }),
  validateSearch: parseListCandidatesQuery,
});

function CandidateDetailRoute() {
  const { candidateId } = Route.useParams();
  return <CandidateDetailPage key={candidateId} />;
}

function CandidateDetailPage() {
  const { candidateId } = Route.useParams();
  const search = Route.useSearch();
  const parsedId = Number(candidateId);
  const invalidId = !Number.isSafeInteger(parsedId) || parsedId < 1;
  const candidateQuery = useQuery({
    ...candidateDetailOptions(parsedId),
    enabled: !invalidId,
  });
  const candidate = candidateQuery.data;
  const loading = candidateQuery.isPending;
  const error = candidateQuery.error?.message ?? null;
  useEffect(() => {
    if (candidateQuery.error) {
      toast.add({
        type: "error",
        title:
          candidateQuery.error.message ||
          "Não foi possível carregar este candidato.",
      });
    }
  }, [candidateQuery.error]);
  const downloadMutation = useMutation({
    mutationFn: () => getCurriculumDownloadUrl(parsedId),
  });
  const downloading = downloadMutation.isPending;

  if (invalidId) {
    return (
      <>
        <Link className="detail-back" search={search} to="/candidates">
          <ArrowLeft aria-hidden="true" />
          Voltar para a lista
        </Link>
        <section className="content-card empty-content" role="alert">
          <FileText aria-hidden="true" />
          <h1>Não foi possível abrir este cadastro</h1>
          <p>O identificador do candidato é inválido.</p>
        </section>
      </>
    );
  }
  if (loading) {
    return (
      <>
        <Link className="detail-back" search={search} to="/candidates">
          <ArrowLeft aria-hidden="true" />
          Voltar para a lista
        </Link>
        <div className="page-heading detail-header">
          <div>
            <h1>Detalhes do candidato</h1>
            <p>Visualize as informações completas do candidato.</p>
          </div>
        </div>
        <CandidateDetailSkeleton />
      </>
    );
  }

  if (error || !candidate) {
    return (
      <>
        <Link className="detail-back" search={search} to="/candidates">
          <ArrowLeft aria-hidden="true" />
          Voltar para a lista
        </Link>
        <section className="content-card empty-content" role="alert">
          <FileText aria-hidden="true" />
          <h1>Não foi possível abrir este cadastro</h1>
          <p>{error ?? "Candidato não encontrado."}</p>
        </section>
      </>
    );
  }

  const { curriculum } = candidate;
  const downloadCurriculum = async () => {
    const downloadTab = window.open("about:blank", "_blank");
    if (!downloadTab) {
      toast.add({
        type: "error",
        title: "Permita a abertura de uma nova aba para baixar o currículo.",
      });
      return;
    }
    downloadTab.opener = null;
    try {
      const url = await toast.promise(downloadMutation.mutateAsync(), {
        error: (downloadError) => ({
          title:
            downloadError instanceof Error
              ? downloadError.message
              : "Não foi possível baixar o currículo.",
        }),
        loading: { title: "Preparando o download do currículo…" },
        success: { title: "O currículo está pronto para baixar." },
      });
      downloadTab.location.href = url;
    } catch {
      downloadTab.close();
    }
  };

  return (
    <>
      <Link className="detail-back" search={search} to="/candidates">
        <ArrowLeft aria-hidden="true" />
        Voltar para a lista
      </Link>
      <div className="page-heading detail-header">
        <div>
          <h1>Detalhes do candidato</h1>
          <p>Visualize as informações completas do candidato.</p>
        </div>
      </div>
      <section
        aria-label="Informações do candidato"
        className="content-card detail-card"
      >
        <div className="candidate-profile">
          <Avatar className="profile-avatar" size="profile" aria-hidden="true">
            <AvatarFallback>{getInitials(candidate.fullName)}</AvatarFallback>
          </Avatar>
          <div className="profile-main">
            <div className="profile-name-row">
              <h2>{candidate.fullName}</h2>
              <Badge variant="success">Cadastrado</Badge>
            </div>
            <dl className="profile-meta">
              <div>
                <dt>
                  <Mail aria-hidden="true" />
                  <span className="sr-only">E-mail</span>
                </dt>
                <dd>
                  <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
                </dd>
              </div>
              {candidate.phone && (
                <div>
                  <dt>
                    <Phone aria-hidden="true" />
                    <span className="sr-only">Telefone</span>
                  </dt>
                  <dd>
                    <a
                      href={`tel:${candidate.phone.replaceAll(/[^\d+]/gu, "")}`}
                    >
                      {candidate.phone}
                    </a>
                  </dd>
                </div>
              )}
              {candidate.interestArea && (
                <div>
                  <dt>
                    <BriefcaseBusiness aria-hidden="true" />
                    <span className="sr-only">Área de interesse</span>
                  </dt>
                  <dd>{candidate.interestArea}</dd>
                </div>
              )}
              {candidate.createdAt && (
                <div>
                  <dt>
                    <CalendarDays aria-hidden="true" />
                    <span className="sr-only">Data de cadastro</span>
                  </dt>
                  <dd>
                    Cadastrado em{" "}
                    <time dateTime={candidate.createdAt}>
                      {formatDate(candidate.createdAt)}
                    </time>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <div className="detail-sections">
          <section aria-labelledby="summary-heading" className="detail-section">
            <h3 className="detail-section-heading" id="summary-heading">
              <FileText aria-hidden="true" />
              Resumo profissional
            </h3>
            <p>
              {candidate.professionalSummary ||
                "Nenhum resumo profissional foi informado."}
            </p>
          </section>
          <section
            aria-labelledby="curriculum-heading"
            className="detail-section"
          >
            <h3 className="detail-section-heading" id="curriculum-heading">
              <FileText aria-hidden="true" />
              Arquivo do currículo
            </h3>
            {curriculum ? (
              <div className="curriculum-file">
                <span className="pdf-icon">
                  <FileText aria-hidden="true" />
                </span>
                <div className="curriculum-meta">
                  <strong>{curriculum.originalName}</strong>
                  <span>{formatFileSize(curriculum.sizeBytes)}</span>
                </div>
                {candidate.hasCurriculum !== false ? (
                  <button
                    className={buttonVariants({ variant: "outline" })}
                    aria-label={`Baixar ${curriculum.originalName}`}
                    disabled={downloading}
                    onClick={downloadCurriculum}
                    type="button"
                  >
                    <Download aria-hidden="true" data-icon="inline-start" />
                    {downloading ? "Preparando…" : "Baixar"}
                  </button>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Download indisponível para este arquivo de demonstração.
                  </span>
                )}
              </div>
            ) : (
              <p>
                {candidate.hasCurriculum
                  ? "Há um currículo associado, mas os dados do arquivo não estão disponíveis."
                  : "Este candidato ainda não possui currículo anexado."}
              </p>
            )}
          </section>
        </div>
      </section>
    </>
  );
}
