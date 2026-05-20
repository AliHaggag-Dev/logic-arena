"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";
import { AdminErrorBoundary, DataTable, StatusBadge, type DataTableColumn } from "@/components/admin";
import { useAdminViewport } from "../../components/AdminViewportContext";
import {
  useAdminFeedback,
  type FeatureRequestItem,
  type FeatureRequestStatus,
  type FeatureRequestStatusFilter,
} from "../../hooks/useAdminFeedback";

const DEFAULT_PAGE = 1;
const PAGE_SIZE = 20;
const FILTERS: FeatureRequestStatusFilter[] = ["ALL", "SUBMITTED", "UNDER_REVIEW", "PLANNED", "SHIPPED", "REJECTED"];
const STATUSES: FeatureRequestStatus[] = ["SUBMITTED", "UNDER_REVIEW", "PLANNED", "SHIPPED", "REJECTED"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

interface DetailModalProps {
  request: FeatureRequestItem;
  onClose: () => void;
}

function DetailModal({ request, onClose }: DetailModalProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-bg-primary/85 px-4 backdrop-blur-sm">
      <section className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-accent/40 bg-card p-5 shadow-[0_0_42px_rgba(var(--accent-rgb),0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent/70">Feature Request</p>
            <h2 className="mt-2 break-words text-2xl font-black uppercase tracking-[0.12em] text-text-primary">{request.title}</h2>
          </div>
          <button type="button" aria-label="Close feature request details" title="Close" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-accent/20 text-text-secondary transition-colors hover:border-accent hover:text-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status={formatLabel(request.priority)} type="priority" />
          <StatusBadge status={formatLabel(request.status)} type="feedback" />
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-accent">{request.votes.toLocaleString()} votes</span>
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-accent">{formatDate(request.createdAt)}</span>
        </div>

        <div className="mt-6 grid gap-5">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">{request.description}</p>
          </section>
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Use Case</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">{request.useCase?.trim() || "No use case provided."}</p>
          </section>
        </div>
      </section>
    </div>
  );
}

export default function AdminFeatureRequestsPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [status, setStatus] = useState<FeatureRequestStatusFilter>("SUBMITTED");
  const [requests, setRequests] = useState<FeatureRequestItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequestItem | null>(null);
  const {
    fetchFeatureRequests,
    updateFeatureRequestStatus,
    deleteFeatureRequest,
    featureRequestsState,
    updateState,
    deleteState,
  } = useAdminFeedback();

  const loadRequests = useCallback(async (): Promise<void> => {
    const result = await fetchFeatureRequests({ page, pageSize: PAGE_SIZE, status, sortOrder: "desc" });
    setRequests(result.items);
    setTotal(result.total);
  }, [fetchFeatureRequests, page, status]);

  useEffect((): void => {
    void loadRequests();
  }, [loadRequests]);

  const handleStatusChange = async (request: FeatureRequestItem, nextStatus: FeatureRequestStatus): Promise<void> => {
    setRequests((currentRequests) => currentRequests.map((item) => (item.id === request.id ? { ...item, status: nextStatus } : item)));
    setSelectedRequest((currentRequest) => (currentRequest?.id === request.id ? { ...currentRequest, status: nextStatus } : currentRequest));
    await updateFeatureRequestStatus(request.id, nextStatus);
    await loadRequests();
  };

  const handleDelete = async (request: FeatureRequestItem): Promise<void> => {
    await deleteFeatureRequest(request.id);
    setRequests((currentRequests) => currentRequests.filter((item) => item.id !== request.id));
    if (selectedRequest?.id === request.id) setSelectedRequest(null);
    await loadRequests();
  };

  const columns = useMemo((): DataTableColumn[] => [
    {
      key: "title",
      label: "Title",
      render: (value, row) => {
        const request = requests.find((item) => item.id === String(row.id));
        return (
          <button
            type="button"
            onClick={() => request && setSelectedRequest(request)}
            className="min-h-11 w-full min-w-56 rounded-lg border border-accent/20 bg-bg-primary px-3 text-left text-sm font-black text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            {String(value ?? "Untitled")}
          </button>
        );
      },
    },
    { key: "priority", label: "Priority", render: (value) => <StatusBadge status={formatLabel(String(value ?? ""))} type="priority" /> },
    { key: "status", label: "Status", render: (value) => <StatusBadge status={formatLabel(String(value ?? ""))} type="feedback" /> },
    { key: "votes", label: "Votes", render: (value) => Number(value ?? 0).toLocaleString() },
    { key: "createdAt", label: "Submitted", render: (value) => formatDate(String(value ?? "")) },
    {
      key: "actions",
      label: "Actions",
      render: (_value, row) => {
        const request = requests.find((item) => item.id === String(row.id));
        if (!request) return null;
        return (
          <div className="flex min-w-56 flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`feature-status-${request.id}`}>Change feature request status</label>
            <select
              id={`feature-status-${request.id}`}
              value={request.status}
              disabled={updateState.isLoading}
              onChange={(event) => void handleStatusChange(request, event.target.value as FeatureRequestStatus)}
              className="min-h-11 rounded-lg border border-accent/20 bg-bg-primary px-3 text-xs font-black uppercase tracking-widest text-accent outline-none transition-colors focus:border-accent disabled:opacity-50"
            >
              {STATUSES.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
            </select>
            <button type="button" aria-label={`Delete ${request.title}`} title="Delete" disabled={deleteState.isLoading} onClick={() => void handleDelete(request)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.1)] text-[var(--sem-danger)] transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ], [deleteState.isLoading, requests, updateState.isLoading]);

  const tableData = useMemo((): Array<Record<string, unknown>> => requests.map((request) => ({ ...request, actions: request.id })), [requests]);
  const error = featureRequestsState.error ?? updateState.error ?? deleteState.error;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Community Feedback</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">FEATURE REQUESTS</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className={`mb-4 grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-6"}`}>
            {FILTERS.map((filter) => (
              <button key={filter} type="button" onClick={() => { setPage(DEFAULT_PAGE); setStatus(filter); }} className={`min-h-11 rounded-lg border px-3 text-xs font-black uppercase tracking-widest transition-colors ${status === filter ? "border-accent bg-accent/15 text-accent" : "border-accent/20 bg-card text-text-secondary hover:border-accent/50 hover:text-text-primary"}`}>
                {formatLabel(filter)}
              </button>
            ))}
          </section>

          <DataTable columns={columns} data={tableData} isLoading={featureRequestsState.isLoading} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} />
        </AdminErrorBoundary>
      </div>
      {selectedRequest && <DetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
    </div>
  );
}
