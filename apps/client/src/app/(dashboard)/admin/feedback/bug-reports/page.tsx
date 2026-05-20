"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { AdminErrorBoundary, DataTable, StatusBadge, type DataTableColumn } from "@/components/admin";
import { useAdminViewport } from "../../components/AdminViewportContext";
import {
  useAdminFeedback,
  type BugReportItem,
  type BugReportStatus,
  type BugReportStatusFilter,
} from "../../hooks/useAdminFeedback";

const DEFAULT_PAGE = 1;
const PAGE_SIZE = 20;
const FILTERS: BugReportStatusFilter[] = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STATUSES: BugReportStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

interface DetailModalProps {
  report: BugReportItem;
  onClose: () => void;
}

function DetailModal({ report, onClose }: DetailModalProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-end bg-bg-primary/85 px-0 backdrop-blur-sm md:place-items-center md:px-4">
      <motion.section
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-accent/40 bg-card p-5 shadow-[0_0_42px_rgba(var(--accent-rgb),0.18)] md:max-h-[86vh] md:max-w-2xl md:rounded-lg"
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent/70">Bug Report</p>
            <h2 className="mt-2 break-words text-2xl font-black uppercase tracking-[0.12em] text-text-primary">{report.title}</h2>
          </div>
          <button type="button" aria-label="Close bug report details" title="Close" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-accent/20 text-text-secondary transition-colors hover:border-accent hover:text-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status={report.severity} type="severity" />
          <StatusBadge status={formatLabel(report.status)} type="feedback" />
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-accent">{formatDate(report.createdAt)}</span>
        </div>

        <div className="mt-6 grid gap-5">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">{report.description}</p>
          </section>
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Steps</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">{report.steps?.trim() || "No steps provided."}</p>
          </section>
        </div>
      </motion.section>
    </div>
  );
}

export default function AdminBugReportsPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [status, setStatus] = useState<BugReportStatusFilter>("OPEN");
  const [reports, setReports] = useState<BugReportItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedReport, setSelectedReport] = useState<BugReportItem | null>(null);
  const {
    fetchBugReports,
    updateBugReportStatus,
    deleteBugReport,
    bugReportsState,
    updateState,
    deleteState,
  } = useAdminFeedback();

  const loadReports = useCallback(async (): Promise<void> => {
    const result = await fetchBugReports({ page, pageSize: PAGE_SIZE, status, sortOrder: "desc" });
    setReports(result.items);
    setTotal(result.total);
  }, [fetchBugReports, page, status]);

  useEffect((): void => {
    void loadReports();
  }, [loadReports]);

  const handleStatusChange = async (report: BugReportItem, nextStatus: BugReportStatus): Promise<void> => {
    setReports((currentReports) => currentReports.map((item) => (item.id === report.id ? { ...item, status: nextStatus } : item)));
    setSelectedReport((currentReport) => (currentReport?.id === report.id ? { ...currentReport, status: nextStatus } : currentReport));
    await updateBugReportStatus(report.id, nextStatus);
    await loadReports();
  };

  const handleDelete = async (report: BugReportItem): Promise<void> => {
    await deleteBugReport(report.id);
    setReports((currentReports) => currentReports.filter((item) => item.id !== report.id));
    if (selectedReport?.id === report.id) setSelectedReport(null);
    await loadReports();
  };

  const columns = useMemo((): DataTableColumn[] => [
    {
      key: "title",
      label: "Title",
      render: (value, row) => {
        const report = reports.find((item) => item.id === String(row.id));
        const isOpen = report?.status === "OPEN";
        return (
          <button
            type="button"
            onClick={() => report && setSelectedReport(report)}
            className={`min-h-11 w-full min-w-56 rounded-lg border bg-bg-primary px-3 text-left text-sm font-black text-text-primary transition-colors hover:border-accent hover:text-accent ${isOpen ? "border-accent shadow-[inset_3px_0_0_var(--accent)]" : "border-accent/20"}`}
          >
            {String(value ?? "Untitled")}
          </button>
        );
      },
    },
    { key: "severity", label: "Severity", render: (value) => <StatusBadge status={String(value ?? "")} type="severity" /> },
    { key: "status", label: "Status", render: (value) => <StatusBadge status={formatLabel(String(value ?? ""))} type="feedback" /> },
    { key: "createdAt", label: "Submitted", render: (value) => formatDate(String(value ?? "")) },
    {
      key: "actions",
      label: "Actions",
      render: (_value, row) => {
        const report = reports.find((item) => item.id === String(row.id));
        if (!report) return null;
        return (
          <div className="flex min-w-56 flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`bug-status-${report.id}`}>Change bug report status</label>
            <select
              id={`bug-status-${report.id}`}
              value={report.status}
              disabled={updateState.isLoading}
              onChange={(event) => void handleStatusChange(report, event.target.value as BugReportStatus)}
              className="min-h-11 rounded-lg border border-accent/20 bg-bg-primary px-3 text-xs font-black uppercase tracking-widest text-accent outline-none transition-colors focus:border-accent disabled:opacity-50"
            >
              {STATUSES.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
            </select>
            <button type="button" aria-label={`Delete ${report.title}`} title="Delete" disabled={deleteState.isLoading} onClick={() => void handleDelete(report)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.1)] text-[var(--sem-danger)] transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ], [deleteState.isLoading, reports, updateState.isLoading]);

  const tableData = useMemo((): Array<Record<string, unknown>> => reports.map((report) => ({ ...report, actions: report.id })), [reports]);
  const error = bugReportsState.error ?? updateState.error ?? deleteState.error;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Community Feedback</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">BUG REPORTS</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className={`mb-4 gap-2 ${isMobile ? "flex overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "grid grid-cols-5"}`}>
            {FILTERS.map((filter) => (
              <button key={filter} type="button" onClick={() => { setPage(DEFAULT_PAGE); setStatus(filter); }} className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs font-black uppercase tracking-widest transition-colors ${status === filter ? "border-accent bg-accent/15 text-accent" : "border-accent/20 bg-card text-text-secondary hover:border-accent/50 hover:text-text-primary"}`}>
                {formatLabel(filter)}
              </button>
            ))}
          </section>

          <DataTable columns={columns} data={tableData} isLoading={bugReportsState.isLoading} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} />
        </AdminErrorBoundary>
      </div>
      {selectedReport && <DetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  );
}
