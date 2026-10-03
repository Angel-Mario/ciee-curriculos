import { ScrollArea } from "@ciee-curriculos/ui/components/scroll-area";
import { Skeleton } from "@ciee-curriculos/ui/components/skeleton";

const DETAIL_LOADING_ROWS = [1, 2, 3, 4];
const LOADING_COLUMNS = [1, 2, 3, 4];

export function CandidateListSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  const loadingRows = Array.from({ length: rowCount }, (_, index) => index + 1);
  return (
    <section
      className="content-card candidate-list-card"
      aria-busy="true"
      aria-label="Lista de candidatos"
    >
      <output className="sr-only">Carregando candidatos…</output>
      <div className="candidate-list-loading" aria-hidden="true">
        <div className="filter-bar">
          <Skeleton className="search-control h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <ScrollArea className="candidate-results-scroll">
          <div className="table-scroll">
            <div className="candidate-table-skeleton">
              <div className="skeleton-table-row skeleton-table-heading">
                {LOADING_COLUMNS.map((column) => (
                  <Skeleton key={column} className="h-4 w-3/4" />
                ))}
              </div>
              {loadingRows.map((row) => (
                <div className="skeleton-table-row" key={row}>
                  {LOADING_COLUMNS.map((column) => (
                    <Skeleton key={column} className="h-5 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="candidate-mobile-list">
            {loadingRows.map((row) => (
              <div
                className="candidate-mobile-card skeleton-mobile-card"
                key={row}
              >
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="size-9" />
                  <Skeleton className="size-9" />
                  <Skeleton className="size-9" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="candidate-table-footer">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    </section>
  );
}

export function CandidateDetailSkeleton() {
  return (
    <section
      className="content-card detail-card"
      aria-busy="true"
      aria-label="Informações do candidato"
    >
      <output className="sr-only">Carregando informações…</output>
      <div aria-hidden="true">
        <div className="candidate-profile">
          <Skeleton className="profile-avatar rounded-full" />
          <div className="profile-main flex flex-col gap-4">
            <Skeleton className="h-7 w-2/3" />
            {DETAIL_LOADING_ROWS.map((row) => (
              <Skeleton key={row} className="h-4 w-3/4" />
            ))}
          </div>
        </div>
        <div className="detail-sections">
          <div className="detail-section flex flex-col gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="detail-section flex flex-col gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
