import { interestAreas } from "@ciee-curriculos/shared";
import type { ListCandidatesQuery } from "@ciee-curriculos/shared";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ciee-curriculos/ui/components/combobox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@ciee-curriculos/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@ciee-curriculos/ui/components/input-group";
import { ScrollArea } from "@ciee-curriculos/ui/components/scroll-area";
import { toast } from "@ciee-curriculos/ui/components/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ciee-curriculos/ui/components/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Info,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CandidateListSkeleton } from "@/components/candidate-loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCandidateMutationOptions } from "@/lib/candidate-mutations";
import { candidateListOptions } from "@/lib/candidate-queries";
import {
  candidateColumns,
  isCandidateSortField,
  parseCandidateListSearch,
} from "@/lib/candidate-sort";
import type { CandidateSortField } from "@/lib/candidate-sort";
import { getCurriculumDownloadUrl, getInitials } from "@/lib/candidates";
import type { Candidate } from "@/lib/candidates";
import { formatBrazilianPhone } from "@/lib/phone";

export const Route = createFileRoute("/candidates/")({
  component: CandidateListPage,
  head: () => ({ meta: [{ title: "Candidatos | CIEE/PR" }] }),
  validateSearch: parseCandidateListSearch,
});
const SEARCH_DEBOUNCE_MS = 500;
const EMPTY_CANDIDATES: Candidate[] = [];
const curriculumFilterItems = [
  { label: "Todos os currículos", value: "all" },
  { label: "Com currículo", value: "yes" },
  { label: "Sem currículo", value: "no" },
];

function CandidateListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const candidateQuery = useQuery(candidateListOptions(search));
  const deleteMutation = useMutation(
    deleteCandidateMutationOptions(queryClient)
  );
  const downloadMutation = useMutation({
    mutationFn: getCurriculumDownloadUrl,
  });
  const candidates = candidateQuery.data?.items ?? EMPTY_CANDIDATES;
  const visibleCandidates = candidates;
  const loading = candidateQuery.isPending;
  const updating = candidateQuery.isFetching && !loading;
  const loadError = candidateQuery.error?.message ?? null;
  const [searchInput, setSearchInput] = useState({
    query: search.q,
    value: search.q ?? "",
  });
  const searchDraft =
    searchInput.query === search.q ? searchInput.value : (search.q ?? "");
  if (searchInput.query !== search.q) {
    setSearchInput({ query: search.q, value: search.q ?? "" });
  }
  const setSearchDraft = (value: string) =>
    setSearchInput({ query: search.q, value });
  const hasActiveFilters = Boolean(
    searchDraft.trim() ||
    search.q ||
    search.interestArea ||
    search.hasCurriculum !== "all"
  );
  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(
    null
  );
  const deleting = deleteMutation.isPending;
  const downloading = downloadMutation.isPending;
  const searchRef = useRef<HTMLInputElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const listViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!candidateQuery.data || candidateQuery.isPlaceholderData) {
      return;
    }
    listViewportRef.current?.scrollTo({ top: 0 });
  }, [candidateQuery.data, candidateQuery.isPlaceholderData]);

  useEffect(() => {
    if (candidateQuery.error) {
      toast.add({
        type: "error",
        title: getRequestErrorTitle(candidateQuery.error).title,
      });
    }
  }, [candidateQuery.error]);

  useEffect(() => {
    const nextQuery = searchDraft.trim() || undefined;
    if (nextQuery === search.q) {
      return;
    }
    const timeout = window.setTimeout(() => {
      navigate({
        replace: true,
        search: (previous) => ({ ...previous, page: 1, q: nextQuery }),
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [navigate, search.q, searchDraft]);

  const pageCount = Math.max(1, candidateQuery.data?.pageCount ?? 1);
  const currentPage = Math.min(search.page, pageCount);
  const total = candidateQuery.data?.total ?? 0;
  const startItem = total === 0 ? 0 : (currentPage - 1) * search.pageSize + 1;
  const endItem = Math.min(currentPage * search.pageSize, total);
  const pageNumbers = [
    ...new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount]),
  ]
    .filter((number) => number >= 1 && number <= pageCount)
    .toSorted((first, second) => first - second);

  useEffect(() => {
    if (
      !candidateQuery.isPending &&
      !candidateQuery.isPlaceholderData &&
      search.page > pageCount
    ) {
      navigate({
        replace: true,
        search: (previous) => ({ ...previous, page: pageCount }),
      });
    }
  }, [
    candidateQuery.isPending,
    candidateQuery.isPlaceholderData,
    navigate,
    pageCount,
    search.page,
  ]);

  const changeSort = async (field: CandidateSortField) => {
    await navigate({
      search: (previous) => ({
        ...previous,
        page: 1,
        sortBy: field,
        sortOrder:
          field === search.sortBy && search.sortOrder === "asc"
            ? "desc"
            : "asc",
      }),
    });
  };
  const clearFilters = async () => {
    setSearchDraft("");
    await navigate({
      search: (previous) => ({
        ...previous,
        hasCurriculum: "all",
        interestArea: undefined,
        page: 1,
        q: undefined,
      }),
    });
    searchRef.current?.focus();
  };
  const closeDelete = () => {
    setCandidateToDelete(null);
    requestAnimationFrame(() => {
      if (deleteTriggerRef.current?.isConnected) {
        deleteTriggerRef.current.focus();
      } else {
        searchRef.current?.focus();
      }
    });
  };
  const handleDelete = async () => {
    if (candidateToDelete === null) {
      return;
    }
    try {
      await toast.promise(deleteMutation.mutateAsync(candidateToDelete), {
        error: getRequestErrorTitle,
        loading: { title: "Excluindo o candidato…" },
        success: { title: "Candidato removido com sucesso." },
      });
      const nextPageCount = Math.max(
        1,
        Math.ceil((total - 1) / search.pageSize)
      );
      await navigate({
        replace: true,
        search: (previous) => ({
          ...previous,
          page: Math.min(previous.page, nextPageCount),
        }),
      });
      closeDelete();
    } catch {
      // The promise toast already reports the failed deletion.
    }
  };
  const handleDownload = async (candidate: Candidate) => {
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
      const url = await toast.promise(
        downloadMutation.mutateAsync(candidate.id),
        {
          error: getRequestErrorTitle,
          loading: { title: "Preparando o download do currículo…" },
          success: { title: "O currículo está pronto para baixar." },
        }
      );
      downloadTab.location.href = url;
    } catch {
      downloadTab.close();
    }
  };
  const openDelete = (id: number, trigger: HTMLButtonElement) => {
    deleteTriggerRef.current = trigger;
    setCandidateToDelete(id);
  };

  if (loading) {
    return (
      <>
        <PageHeading />
        <CandidateListSkeleton rowCount={Math.min(search.pageSize, 10)} />
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <PageHeading />
        <section className="content-card empty-content" role="alert">
          <Info aria-hidden="true" />
          <h2>Não foi possível carregar os candidatos</h2>
          <p>{loadError}</p>
          <Button
            disabled={candidateQuery.isFetching}
            onClick={async () => await candidateQuery.refetch()}
            variant="outline"
          >
            {candidateQuery.isFetching
              ? "Tentando novamente…"
              : "Tentar novamente"}
          </Button>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeading />
      <section
        aria-label="Lista de candidatos"
        className="content-card candidate-list-card"
      >
        <output className="sr-only" aria-live="polite">
          {updating ? "Atualizando candidatos…" : ""}
        </output>
        <div className="filter-bar">
          <div className="filter-field search-control">
            <div className="search-field-heading">
              <label htmlFor="candidate-search">
                Buscar por nome ou e-mail
              </label>
              {hasActiveFilters && (
                <Button onClick={clearFilters} size="xs" variant="ghost">
                  <X aria-hidden="true" data-icon="inline-start" />
                  Limpar filtros
                </Button>
              )}
            </div>
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchRef}
                id="candidate-search"
                type="search"
                name="search"
                autoComplete="off"
                placeholder="Buscar por nome ou e-mail…"
                onChange={(event) => setSearchDraft(event.target.value)}
                value={searchDraft}
              />
            </InputGroup>
          </div>
          <div className="filter-field">
            <label htmlFor="candidate-area-filter">Área de interesse</label>
            <Combobox
              items={interestAreas}
              value={search.interestArea ?? null}
              onValueChange={async (value) => {
                await navigate({
                  search: (previous) => ({
                    ...previous,
                    interestArea: value ?? undefined,
                    page: 1,
                  }),
                });
              }}
            >
              <ComboboxInput
                id="candidate-area-filter"
                className="w-full"
                placeholder="Todas as áreas"
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>Nenhuma área encontrada.</ComboboxEmpty>
                <ComboboxList>
                  {(area: string) => (
                    <ComboboxItem key={area} value={area}>
                      {area}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="filter-field">
            <label htmlFor="candidate-curriculum-filter">Currículo</label>
            <Select
              items={curriculumFilterItems}
              value={search.hasCurriculum}
              onValueChange={async (value) => {
                if (value === "all" || value === "yes" || value === "no") {
                  await navigate({
                    search: (previous) => ({
                      ...previous,
                      hasCurriculum: value,
                      page: 1,
                    }),
                  });
                }
              }}
            >
              <SelectTrigger
                id="candidate-curriculum-filter"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {curriculumFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {total === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRound aria-hidden="true" />
              </EmptyMedia>
              <h2 className="text-lg font-semibold">
                {!search.q &&
                !search.interestArea &&
                search.hasCurriculum === "all"
                  ? "Sua lista ainda está vazia"
                  : "Nenhum candidato encontrado"}
              </h2>
              <EmptyDescription>
                {!search.q &&
                !search.interestArea &&
                search.hasCurriculum === "all"
                  ? "Cadastre o primeiro candidato para começar."
                  : "Tente outro nome ou e-mail, ou limpe os filtros."}
              </EmptyDescription>
            </EmptyHeader>
            {!search.q &&
            !search.interestArea &&
            search.hasCurriculum === "all" ? (
              <Link className={buttonVariants()} to="/candidates/new">
                <Plus aria-hidden="true" data-icon="inline-start" />
                Novo candidato
              </Link>
            ) : (
              <Button onClick={clearFilters} variant="outline">
                Limpar busca
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <div className="candidate-sort-bar">
              <label htmlFor="candidate-sort">Ordenar candidatos por</label>
              <Select
                value={search.sortBy}
                onValueChange={(value) => {
                  if (isCandidateSortField(value)) {
                    changeSort(value);
                  }
                }}
              >
                <SelectTrigger id="candidate-sort">
                  <SelectValue>
                    {
                      candidateColumns.find(
                        (column) => column.key === search.sortBy
                      )?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {candidateColumns.map((column) => (
                      <SelectItem key={column.key} value={column.key}>
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={async () =>
                  await navigate({
                    search: (previous) => ({
                      ...previous,
                      page: 1,
                      sortOrder: previous.sortOrder === "asc" ? "desc" : "asc",
                    }),
                  })
                }
              >
                {search.sortOrder === "asc" ? (
                  <ArrowUp aria-hidden="true" data-icon="inline-start" />
                ) : (
                  <ArrowDown aria-hidden="true" data-icon="inline-start" />
                )}
                {search.sortOrder === "asc" ? "Crescente" : "Decrescente"}
              </Button>
            </div>
            <ScrollArea
              className="candidate-results-scroll"
              viewportProps={{
                ref: listViewportRef,
                role: "region",
                "aria-label": "Resultados de candidatos",
                tabIndex: 0,
              }}
            >
              <div className="table-scroll">
                <Table className="candidate-table">
                  <caption className="sr-only">
                    Candidatos cadastrados, contatos e ações
                  </caption>
                  <TableHeader>
                    <TableRow>
                      {candidateColumns
                        .filter((column) => column.key !== "email")
                        .map((column) => (
                          <SortableHeader
                            key={column.key}
                            column={column}
                            sortField={search.sortBy}
                            ascending={search.sortOrder === "asc"}
                            onSort={changeSort}
                          />
                        ))}
                      <TableHead scope="col">Currículo</TableHead>
                      <TableHead scope="col">Ações</TableHead>
                    </TableRow>
                    <TableRow className="candidate-refresh-row">
                      <TableHead colSpan={5} className="candidate-refresh-cell">
                        <CandidateRefreshProgress updating={updating} />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody aria-busy={updating}>
                    {visibleCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <CandidateIdentity candidate={candidate} />
                        </TableCell>
                        <TableCell className="candidate-phone">
                          {formatBrazilianPhone(candidate.phone)}
                        </TableCell>
                        <TableCell>{candidate.interestArea || "—"}</TableCell>
                        <TableCell>
                          <CandidateCurriculumStatus candidate={candidate} />
                        </TableCell>
                        <TableCell>
                          <CandidateActions
                            candidate={candidate}
                            onDelete={openDelete}
                            onDownload={handleDownload}
                            downloading={downloading}
                            search={search}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="candidate-mobile-progress">
                <CandidateRefreshProgress updating={updating} />
              </div>
              <div className="candidate-mobile-list" aria-busy={updating}>
                {visibleCandidates.map((candidate) => (
                  <article className="candidate-mobile-card" key={candidate.id}>
                    <CandidateIdentity candidate={candidate} heading />
                    <dl>
                      <div>
                        <dt>Telefone</dt>
                        <dd>{formatBrazilianPhone(candidate.phone)}</dd>
                      </div>
                      <div>
                        <dt>Área de interesse</dt>
                        <dd>{candidate.interestArea || "Não informada"}</dd>
                      </div>
                    </dl>
                    <div className="candidate-row-actions">
                      <CandidateCurriculumStatus candidate={candidate} />
                      <CandidateActions
                        candidate={candidate}
                        onDelete={openDelete}
                        onDownload={handleDownload}
                        downloading={downloading}
                        search={search}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
        <div className="candidate-table-footer">
          <output aria-live="polite" aria-atomic="true">
            Mostrando {startItem} a {endItem} de {total} candidatos
          </output>
          {pageCount > 1 && (
            <Pagination aria-label="Paginação de candidatos">
              <PaginationContent className="pagination-list">
                <PaginationItem>
                  <Button
                    aria-label="Página anterior"
                    disabled={currentPage === 1}
                    onClick={async () =>
                      await navigate({
                        search: (previous) => ({
                          ...previous,
                          page: currentPage - 1,
                        }),
                      })
                    }
                    size="icon-sm"
                    variant="outline"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                </PaginationItem>
                {pageNumbers.map((pageNumber, index) => (
                  <PaginationItem key={pageNumber}>
                    {index > 0 &&
                      pageNumber - (pageNumbers[index - 1] ?? 0) > 1 && (
                        <span aria-hidden="true" className="px-2">
                          …
                        </span>
                      )}
                    <Button
                      aria-label={`Página ${pageNumber}`}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                      onClick={async () =>
                        await navigate({
                          search: (previous) => ({
                            ...previous,
                            page: pageNumber,
                          }),
                        })
                      }
                      size="icon-sm"
                      variant={
                        pageNumber === currentPage ? "default" : "outline"
                      }
                    >
                      {pageNumber}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <Button
                    aria-label="Próxima página"
                    disabled={currentPage === pageCount}
                    onClick={async () =>
                      await navigate({
                        search: (previous) => ({
                          ...previous,
                          page: currentPage + 1,
                        }),
                      })
                    }
                    size="icon-sm"
                    variant="outline"
                  >
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </section>
      <AlertDialog
        open={candidateToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            closeDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir candidato?</AlertDialogTitle>
            <AlertDialogDescription>
              O cadastro de{" "}
              {
                candidates.find(
                  (candidate) => candidate.id === candidateToDelete
                )?.fullName
              }{" "}
              será removido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDelete}
              variant="destructive"
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function PageHeading() {
  return (
    <div className="page-heading">
      <div>
        <h1>Candidatos</h1>
        <p>Cadastre e consulte os candidatos da nossa base.</p>
      </div>
      <div className="page-heading-actions">
        <Link className={buttonVariants()} to="/candidates/new">
          <Plus aria-hidden="true" data-icon="inline-start" />
          Novo candidato
        </Link>
      </div>
    </div>
  );
}
function CandidateRefreshProgress({ updating }: { updating: boolean }) {
  return (
    <div
      className="candidate-refresh-progress"
      role={updating ? "progressbar" : undefined}
      aria-label={updating ? "Atualizando candidatos" : undefined}
      aria-hidden={!updating}
      data-active={updating}
    />
  );
}

function CandidateIdentity({
  candidate,
  heading = false,
}: {
  candidate: Candidate;
  heading?: boolean;
}) {
  return (
    <div className="candidate-identity">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback>{getInitials(candidate.fullName)}</AvatarFallback>
      </Avatar>
      <div className="candidate-identity-text">
        {heading ? (
          <h2>{candidate.fullName}</h2>
        ) : (
          <span className="candidate-fullname">{candidate.fullName}</span>
        )}
        <a className="candidate-email" href={`mailto:${candidate.email}`}>
          {candidate.email}
        </a>
      </div>
    </div>
  );
}

function CandidateCurriculumStatus({ candidate }: { candidate: Candidate }) {
  return (
    <Badge
      variant="outline"
      aria-label={candidate.hasCurriculum ? "Com currículo" : "Sem currículo"}
    >
      {candidate.hasCurriculum ? "PDF" : "Sem PDF"}
    </Badge>
  );
}

function CandidateActions({
  candidate,
  onDelete,
  onDownload,
  downloading,
  search,
}: {
  candidate: Candidate;
  onDelete: (id: number, trigger: HTMLButtonElement) => void;
  onDownload: (candidate: Candidate) => void;
  downloading: boolean;
  search: ListCandidatesQuery;
}) {
  return (
    <div className="table-actions">
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              aria-label={`Ver detalhes de ${candidate.fullName}`}
              className={buttonVariants({
                size: "sm",
                variant: "outline",
              })}
              params={{ candidateId: String(candidate.id) }}
              search={search}
              to="/candidates/$candidateId"
            />
          }
        >
          <Eye aria-hidden="true" data-icon="inline-start" />
          Detalhes
        </TooltipTrigger>
        <TooltipContent>Ver detalhes</TooltipContent>
      </Tooltip>
      {candidate.hasCurriculum && (
        <Tooltip>
          <TooltipTrigger
            aria-label={`Baixar currículo de ${candidate.fullName}`}
            disabled={downloading}
            render={<Button size="icon-sm" variant="outline" />}
            onClick={() => onDownload(candidate)}
          >
            <FileDown aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>
            {downloading ? "Preparando download…" : "Baixar currículo"}
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          aria-label={`Excluir ${candidate.fullName}`}
          render={<Button size="icon-sm" variant="outline" />}
          onClick={(event) => onDelete(candidate.id, event.currentTarget)}
        >
          <Trash2 aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>Excluir candidato</TooltipContent>
      </Tooltip>
    </div>
  );
}

function getRequestErrorTitle(error: unknown): { title: string } {
  return {
    title:
      error instanceof Error
        ? error.message
        : "A solicitação falhou. Tente novamente.",
  };
}

function SortableHeader({
  column,
  sortField,
  ascending,
  onSort,
}: {
  column: (typeof candidateColumns)[number];
  sortField: CandidateSortField;
  ascending: boolean;
  onSort: (field: CandidateSortField) => void;
}) {
  const active = column.key === sortField;
  let direction: "ascending" | "descending" | "none" = "none";
  if (active) {
    direction = ascending ? "ascending" : "descending";
  }
  let icon = <ArrowUpDown aria-hidden="true" />;
  if (active) {
    icon = ascending ? (
      <ArrowUp aria-hidden="true" />
    ) : (
      <ArrowDown aria-hidden="true" />
    );
  }
  return (
    <TableHead scope="col" aria-sort={direction}>
      <button
        className="sort-button"
        type="button"
        aria-label={`Ordenar por ${column.label.toLocaleLowerCase("pt-BR")} em ordem ${active && ascending ? "decrescente" : "crescente"}`}
        onClick={() => onSort(column.key)}
      >
        {column.label}
        {icon}
      </button>
    </TableHead>
  );
}
