"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, Search, ShieldCheck, Trophy, UserCheck, Users } from "lucide-react";
import { AdminErrorBoundary, AreaChart, DataTable, DonutChart, KpiCard, type AreaChartDatum, type DataTableColumn, type DonutChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminUsers, useAdminUserStats, type AdminUserSortBy } from "../hooks/useAdminUsers";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const DEFAULT_PAGE = 1;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const WEEK_DAYS = 7;
const PERCENT_MULTIPLIER = 100;
const SORT_OPTIONS: Array<{ value: AdminUserSortBy; label: string }> = [
  { value: "rank", label: "Rank" },
  { value: "points", label: "Points" },
  { value: "createdAt", label: "Joined" },
];

function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * PERCENT_MULTIPLIER)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function mapAreaData(timeline: Array<{ date: string; count: number }> | undefined): AreaChartDatum[] {
  return (timeline ?? []).map((item) => ({ date: item.date.slice(5), value: item.count }));
}

function getInitials(value: unknown): string {
  const username = String(value ?? "?").trim();
  return username.slice(0, 2).toUpperCase();
}

interface AdminUserSortSelectProps {
  value: AdminUserSortBy;
  onChange: (value: AdminUserSortBy) => void;
}

function AdminUserSortSelect({ value, onChange }: AdminUserSortSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];

  useEffect((): (() => void) => {
    function handlePointerDown(event: PointerEvent): void {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return (): void => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Sort users"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-accent/20 bg-bg-primary px-3 text-left text-sm font-black uppercase tracking-widest text-accent outline-none transition-colors hover:border-accent/50 focus:border-accent"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort users"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] overflow-hidden rounded-lg border border-accent/40 bg-bg-primary p-1 shadow-[0_14px_34px_rgba(var(--accent-rgb),0.18)]"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm font-black uppercase tracking-widest transition-colors ${
                  isSelected
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary hover:bg-accent/10 hover:text-text-primary"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<AdminUserSortBy>("createdAt");
  const { stats, isLoading: statsLoading, error: statsError } = useAdminUserStats();
  const { users, total, isLoading: usersLoading, error: usersError } = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search,
    sortBy,
    sortOrder: "desc",
  });

  useEffect((): (() => void) => {
    const timeoutId = window.setTimeout(() => {
      setPage(DEFAULT_PAGE);
      setSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const totalUsers = stats?.totalUsers ?? 0;
  const oauthUsers = (stats?.providerBreakdown.google ?? 0) + (stats?.providerBreakdown.github ?? 0);
  const newThisWeek = (stats?.registrationTimeline ?? []).slice(-WEEK_DAYS).reduce((sum, item) => sum + item.count, 0);
  const registrationData = useMemo((): AreaChartDatum[] => mapAreaData(stats?.registrationTimeline), [stats]);
  const providerData = useMemo((): DonutChartDatum[] => [
    { label: "Local", value: stats?.providerBreakdown.local ?? 0, color: "var(--accent)" },
    { label: "Google", value: stats?.providerBreakdown.google ?? 0, color: "var(--sem-success)" },
    { label: "GitHub", value: stats?.providerBreakdown.github ?? 0, color: "var(--sem-info)" },
  ], [stats]);

  const columns = useMemo((): DataTableColumn[] => [
    {
      key: "username",
      label: "User",
      render: (value) => (
        <div className="flex min-w-48 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-xs font-black text-accent">
            {getInitials(value)}
          </span>
          <span className="font-black text-text-primary">{String(value ?? "Unknown")}</span>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    { key: "rank", label: "Rank", render: (value) => <span className="font-black text-accent">#{Number(value ?? 0).toLocaleString()}</span> },
    { key: "points", label: "Points", render: (value) => Number(value ?? 0).toLocaleString() },
    {
      key: "provider",
      label: "Provider",
      render: (value) => (
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-accent">
          {String(value ?? "local")}
        </span>
      ),
    },
    {
      key: "isVerified",
      label: "Verified",
      render: (value) => (
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${value ? "border-[var(--sem-success)] bg-[rgba(var(--sem-success-rgb),0.14)] text-[var(--sem-success)]" : "border-[var(--sem-warning)] bg-[rgba(var(--sem-warning-rgb),0.14)] text-[var(--sem-warning)]"}`}>
          {value ? "Verified" : "Pending"}
        </span>
      ),
    },
    { key: "createdAt", label: "Joined", render: (value) => formatDate(String(value ?? "")) },
  ], []);

  const tableData = useMemo((): Array<Record<string, unknown>> => users.map((user) => ({ ...user })), [users]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Identity Control</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">USER MANAGEMENT</h1>
        </header>

        <AdminErrorBoundary>
          {(statsError || usersError) && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{statsError ?? usersError}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Users" value={totalUsers} icon={<Users className="h-5 w-5" />} isLoading={statsLoading} />
            <KpiCard title="Verified %" value={formatPercent(stats?.verifiedCount ?? 0, totalUsers)} icon={<ShieldCheck className="h-5 w-5" />} isLoading={statsLoading} />
            <KpiCard title="OAuth Users %" value={formatPercent(oauthUsers, totalUsers)} icon={<UserCheck className="h-5 w-5" />} isLoading={statsLoading} />
            <KpiCard title="New This Week" value={newThisWeek} icon={<CheckCircle2 className="h-5 w-5" />} isLoading={statsLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <AreaChart data={registrationData} title="Registration Timeline" height={chartHeight} isLoading={statsLoading} />
            <DonutChart data={providerData} title="Auth Provider Mix" height={chartHeight} isLoading={statsLoading} />
          </section>

          <section className="mt-6">
          <div className="mb-4 rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)]">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative block">
                <span className="sr-only">Search users</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="min-h-11 w-full rounded-lg border border-accent/20 bg-bg-primary pl-10 pr-3 text-sm font-bold text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-accent" placeholder="Search users" />
              </label>
              <AdminUserSortSelect
                value={sortBy}
                onChange={(nextSortBy) => {
                  setPage(DEFAULT_PAGE);
                  setSortBy(nextSortBy);
                }}
              />
            </div>
          </div>
            <DataTable columns={columns} data={tableData} isLoading={usersLoading} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} />
          </section>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
