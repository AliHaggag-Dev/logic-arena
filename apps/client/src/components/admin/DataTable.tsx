"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useAdminViewport } from "@/app/(dashboard)/admin/components/AdminViewportContext";
import { TableSkeleton } from "./AdminSkeleton";

const DEFAULT_SKELETON_ROWS = 6;
const FIRST_PAGE = 1;

export interface DataTableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  data: Array<Record<string, unknown>>;
  isLoading?: boolean;
  pagination?: DataTablePagination;
}

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

function compareValues(aValue: unknown, bValue: unknown, direction: SortDirection): number {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  if (typeof aValue === "number" && typeof bValue === "number") {
    return (aValue - bValue) * directionMultiplier;
  }

  return String(aValue ?? "").localeCompare(String(bValue ?? "")) * directionMultiplier;
}

function getTotalPages(pagination: DataTablePagination): number {
  return Math.max(Math.ceil(pagination.total / pagination.pageSize), FIRST_PAGE);
}

export function DataTable({ columns, data, isLoading = false, pagination }: DataTableProps): React.ReactElement {
  const [sortState, setSortState] = useState<SortState | undefined>();
  const { isMobile } = useAdminViewport();

  const sortedData = useMemo((): Array<Record<string, unknown>> => {
    if (!sortState) {
      return data;
    }

    return [...data].sort((leftRow, rightRow) => compareValues(leftRow[sortState.key], rightRow[sortState.key], sortState.direction));
  }, [data, sortState]);

  const totalPages = pagination ? getTotalPages(pagination) : FIRST_PAGE;

  const handleSort = (key: string): void => {
    setSortState((currentState) => {
      if (currentState?.key !== key) {
        return { key, direction: "asc" };
      }

      return { key, direction: currentState.direction === "asc" ? "desc" : "asc" };
    });
  };

  if (isLoading) {
    return <TableSkeleton rows={DEFAULT_SKELETON_ROWS} />;
  }

  if (isMobile) {
    if (columns.length === 0) {
      return (
        <section className="rounded-lg border border-accent/20 bg-card p-8 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-text-primary">No columns configured</p>
        </section>
      );
    }

    return (
      <div className="grid gap-3">
        {sortedData.length === 0 ? (
          <section className="rounded-lg border border-accent/20 bg-card p-8 text-center shadow-[var(--card-shadow)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-text-primary">No records found</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">Try a different filter.</p>
          </section>
        ) : (
          sortedData.map((row, rowIndex) => {
            const titleColumn = columns[0]!;
            const detailColumns = columns.slice(1);
            return (
              <article key={`card-${rowIndex}`} className="rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)]">
                <div className="mb-4 [&_button]:min-w-0">
                  {titleColumn.render ? titleColumn.render(row[titleColumn.key], row) : (
                    <h2 className="break-words text-base font-black uppercase tracking-[0.12em] text-text-primary">
                      {String(row[titleColumn.key] ?? "")}
                    </h2>
                  )}
                </div>
                <dl className="grid gap-3">
                  {detailColumns.map((column) => {
                    const content = column.render ? column.render(row[column.key], row) : String(row[column.key] ?? "");
                    const isActionsColumn = column.key === "actions";
                    return (
                      <div key={`${rowIndex}-${column.key}`} className={isActionsColumn ? "pt-2 [&_button]:w-full [&_select]:w-full [&>div]:w-full" : "grid gap-1"}>
                        {!isActionsColumn && (
                          <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">{column.label}</dt>
                        )}
                        <dd className={isActionsColumn ? "[&_*]:min-w-0 [&_div]:w-full [&_button]:min-h-11 [&_button]:w-full [&_select]:min-h-11 [&_select]:w-full" : "break-words text-sm font-bold text-text-primary"}>
                          {content}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </article>
            );
          })
        )}

        {pagination && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-accent/20 bg-card px-4 py-3 font-mono text-xs text-text-secondary shadow-[var(--card-shadow)]">
            <span>
              Page {pagination.page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => pagination.onPageChange(Math.max(pagination.page - 1, FIRST_PAGE))}
                disabled={pagination.page <= FIRST_PAGE}
                className="flex h-11 w-11 items-center justify-center rounded border border-accent/20 text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => pagination.onPageChange(Math.min(pagination.page + 1, totalPages))}
                disabled={pagination.page >= totalPages}
                className="flex h-11 w-11 items-center justify-center rounded border border-accent/20 text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-accent/20 bg-card shadow-[var(--card-shadow)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="border-b border-accent/20 bg-accent/5">
            <tr>
              {columns.map((column) => {
                const isActiveSort = sortState?.key === column.key;
                const SortIcon = !isActiveSort ? ChevronsUpDown : sortState.direction === "asc" ? ChevronUp : ChevronDown;

                return (
                  <th key={column.key} scope="col" className="px-4 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="inline-flex min-h-11 items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-text-secondary transition-colors hover:text-accent"
                    >
                      <span>{column.label}</span>
                      <SortIcon className="h-3.5 w-3.5" />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/10">
            {sortedData.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="bg-card transition-colors odd:bg-accent/5 hover:bg-accent/10">
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className="px-4 py-3 text-sm text-text-primary">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between gap-4 border-t border-accent/20 px-4 py-3 font-mono text-xs text-text-secondary">
          <span>
            Page {pagination.page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => pagination.onPageChange(Math.max(pagination.page - 1, FIRST_PAGE))}
              disabled={pagination.page <= FIRST_PAGE}
              className="flex h-11 w-11 items-center justify-center rounded border border-accent/20 text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => pagination.onPageChange(Math.min(pagination.page + 1, totalPages))}
              disabled={pagination.page >= totalPages}
              className="flex h-11 w-11 items-center justify-center rounded border border-accent/20 text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
