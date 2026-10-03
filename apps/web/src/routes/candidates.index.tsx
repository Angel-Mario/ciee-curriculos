import { parseListCandidatesQuery } from "@ciee-curriculos/shared";
import type { ListCandidatesQuery } from "@ciee-curriculos/shared";
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
import { candidateColumns, isCandidateSortField } from "@/lib/candidate-sort";
import type { CandidateSortField } from "@/lib/candidate-sort";
import type { Candidate } from "@/lib/candidates";

export const Route = createFileRoute("/candidates/")({
  component: CandidatesPage,
  head: () => ({ meta: [{ title: "Candidatos | CIEE/PR" }] }),
  validateSearch: parseListCandidatesQuery,
});
const EMPTY_CANDIDATES: Candidate[] = [];

function CandidatesPage() {
  const { q } = Route.useSearch();
  return <CandidateListPage key={q ?? ""} />;
}

function CandidateListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const candidateQuery = useQuery(candidateListOptions(search));
  const deleteMutation = useMutation(
    deleteCandidateMutationOptions(queryClient)
  );
  const candidates = candidateQuery.data?.items ?? EMPTY_CANDIDATES;
  const visibleCandidates = candidates;
  const loading = candidateQuery.isPending;
  const usingMockData = candidateQuery.data?.usingMockData ?? false;
  const loadError = candidateQuery.error?.message ?? null;
  const [searchDraft, setSearchDraft] = useState(search.q ?? "");
  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(
    null
  );
  const deleting = deleteMutation.isPending;
  const searchRef = useRef<HTMLInputElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);

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
    }, 250);
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
    if (search.page > pageCount) {
      navigate({
        replace: true,
        search: (previous) => ({ ...previous, page: pageCount }),
      });
    }
  }, [navigate, pageCount, search.page]);

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
      await deleteMutation.mutateAsync(candidateToDelete);
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
      toast.add({ type: "success", title: "Candidato removido com sucesso." });
      closeDelete();
    } catch (error) {
      toast.add({
        type: "error",
        title:
          error instanceof Error
            ? error.message
            : "Não foi possível remover o candidato. Tente novamente.",
      });
    }
  };
  const openDelete = (id: number, trigger: HTMLButtonElement) => {
    deleteTriggerRef.current = trigger;
    setCandidateToDelete(id);
  };

  if (loading) {
    return (
      <>
        <PageHeading usingMockData={false} />
        <CandidateListSkeleton />
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <PageHeading usingMockData={usingMockData} />
        <section className="content-card empty-content" role="alert">
          <Info aria-hidden="true" />
          <h2>Não foi possível carregar os candidatos</h2>
          <p>{loadError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeading usingMockData={usingMockData} />
      <section aria-label="Lista de candidatos" className="content-card">
        <div className="filter-bar">
          <div className="search-control">
            <label className="sr-only" htmlFor="candidate-search">
              Buscar por nome ou e-mail
            </label>
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
          <label className="sr-only" htmlFor="candidate-curriculum-filter">
            Filtrar por currículo anexado
          </label>
          <Select
            value={search.hasCurriculum}
            onValueChange={(value) => {
              if (value === "all" || value === "yes" || value === "no") {
                void navigate({
                  search: (previous) => ({
                    ...previous,
                    hasCurriculum: value,
                    page: 1,
                  }),
                });
              }
            }}
          >
            <SelectTrigger id="candidate-curriculum-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todos os currículos</SelectItem>
                <SelectItem value="yes">Com currículo</SelectItem>
                <SelectItem value="no">Sem currículo</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <label className="sr-only" htmlFor="candidate-area-filter">
            Filtrar por área de interesse
          </label>
          <InputGroup className="search-control">
            <InputGroupInput
              id="candidate-area-filter"
              placeholder="Área de interesse"
              value={search.interestArea ?? ""}
              onChange={(event) => {
                void navigate({
                  replace: true,
                  search: (previous) => ({
                    ...previous,
                    interestArea: event.target.value.trim() || undefined,
                    page: 1,
                  }),
                });
              }}
            />
          </InputGroup>
          <Button
            disabled={
              !searchDraft &&
              !search.interestArea &&
              search.hasCurriculum === "all"
            }
            onClick={clearFilters}
            variant="outline"
          >
            <X aria-hidden="true" data-icon="inline-start" />
            Limpar filtros
          </Button>
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
            <div className="mobile-sort">
              <label className="sr-only" htmlFor="candidate-sort">
                Ordenar candidatos por
              </label>
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
            <div className="table-scroll">
              <Table className="candidate-table">
                <caption className="sr-only">
                  Candidatos cadastrados, contatos e ações
                </caption>
                <TableHeader>
                  <TableRow>
                    {candidateColumns.map((column) => (
                      <SortableHeader
                        key={column.key}
                        column={column}
                        sortField={search.sortBy}
                        ascending={search.sortOrder === "asc"}
                        onSort={changeSort}
                      />
                    ))}
                    <TableHead scope="col">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>{candidate.id}</TableCell>
                      <TableCell>
                        <span className="candidate-name-content">
                          <span className="candidate-fullname">
                            {candidate.fullName}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="candidate-email">
                        {candidate.email}
                      </TableCell>
                      <TableCell>{candidate.phone || "—"}</TableCell>
                      <TableCell>{candidate.interestArea || "—"}</TableCell>
                      <TableCell>
                        <CandidateActions
                          candidate={candidate}
                          onDelete={openDelete}
                          search={search}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="candidate-mobile-list">
              {visibleCandidates.map((candidate) => (
                <article className="candidate-mobile-card" key={candidate.id}>
                  <h2>{candidate.fullName}</h2>
                  <dl>
                    <div>
                      <dt>E-mail</dt>
                      <dd>{candidate.email}</dd>
                    </div>
                    <div>
                      <dt>Telefone</dt>
                      <dd>{candidate.phone || "Não informado"}</dd>
                    </div>
                    <div>
                      <dt>Área de interesse</dt>
                      <dd>{candidate.interestArea || "Não informada"}</dd>
                    </div>
                    <div>
                      <dt>Código</dt>
                      <dd>{candidate.id}</dd>
                    </div>
                  </dl>
                  <CandidateActions
                    candidate={candidate}
                    onDelete={openDelete}
                    search={search}
                  />
                </article>
              ))}
            </div>
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
function PageHeading({ usingMockData }: { usingMockData: boolean }) {
  return (
    <div className="page-heading">
      <div>
        <h1>Candidatos</h1>
        <p>
          Cadastre e consulte os candidatos da nossa base.
          {usingMockData && (
            <Tooltip>
              <TooltipTrigger
                className="mode-status"
                aria-label="Modo demonstração: mais informações"
              >
                Modo demonstração
              </TooltipTrigger>
              <TooltipContent>
                Dados de exemplo salvos neste navegador. A API está
                indisponível.
              </TooltipContent>
            </Tooltip>
          )}
        </p>
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
function CandidateActions({
  candidate,
  onDelete,
  search,
}: {
  candidate: Candidate;
  onDelete: (id: number, trigger: HTMLButtonElement) => void;
  search: ListCandidatesQuery;
}) {
  return (
    <div className="table-actions">
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              aria-label={`Ver ${candidate.fullName}`}
              className={buttonVariants({
                size: "icon-sm",
                variant: "secondary",
              })}
              params={{ candidateId: String(candidate.id) }}
              search={search}
              to="/candidates/$candidateId"
            />
          }
        >
          <Eye aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>Ver detalhes</TooltipContent>
      </Tooltip>
      {candidate.hasCurriculum && (
        <Tooltip>
          <TooltipTrigger
            aria-label={`Baixar currículo de ${candidate.fullName} (em breve)`}
            aria-disabled="true"
            render={<Button size="icon-sm" variant="outline" />}
          >
            <FileDown aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Baixar currículo — em breve</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          aria-label={`Excluir ${candidate.fullName}`}
          render={<Button size="icon-sm" variant="destructive" />}
          onClick={(event) => onDelete(candidate.id, event.currentTarget)}
        >
          <Trash2 aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>Excluir candidato</TooltipContent>
      </Tooltip>
    </div>
  );
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
