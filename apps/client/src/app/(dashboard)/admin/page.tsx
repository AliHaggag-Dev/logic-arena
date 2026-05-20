"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, FileCode2, HeartPulse, RefreshCcw, Swords, Users } from "lucide-react";
import { AdminErrorBoundary, AreaChart, BarChart, ChartSkeleton, KpiCard } from "@/components/admin";
import type { AreaChartDatum, BarChartDatum } from "@/components/admin";
import { apiClient } from "@/lib/api-client";
import { useAdminStats } from "./hooks/useAdminStats";
import { useAdminViewport } from "./components/AdminViewportContext";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const BYTES_PER_MEGABYTE = 1_048_576;

interface DailyCount {
  date: string;
  count: number;
}

interface UserStats {
  registrationTimeline: DailyCount[];
}

interface MatchStats {
  matchesPerDay: DailyCount[];
}

interface HealthStats {
  uptimeSeconds: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  nodeVersion: string;
  redisHealthy: boolean;
  dbHealthy: boolean;
}

interface DashboardDetails {
  userStats: UserStats | null;
  matchStats: MatchStats | null;
  healthStats: HealthStats | null;
}

function mapAreaData(timeline: DailyCount[] | undefined): AreaChartDatum[] {
  return (timeline ?? []).map((item) => ({
    date: item.date.slice(5),
    value: item.count,
  }));
}

function mapBarData(timeline: DailyCount[] | undefined): BarChartDatum[] {
  return (timeline ?? []).map((item) => ({
    label: item.date.slice(5),
    value: item.count,
  }));
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / BYTES_PER_MEGABYTE).toLocaleString()} MB`;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${hours.toLocaleString()}h ${minutes}m`;
}

export default function AdminOverviewPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error, refetch } = useAdminStats();
  const [details, setDetails] = useState<DashboardDetails>({
    userStats: null,
    matchStats: null,
    healthStats: null,
  });
  const [detailsLoading, setDetailsLoading] = useState<boolean>(true);

  const loadDetails = useCallback(async (): Promise<void> => {
    setDetailsLoading(true);
    try {
      const [userResponse, matchResponse, healthResponse] = await Promise.all([
        apiClient.get<UserStats>("/admin/stats/users"),
        apiClient.get<MatchStats>("/admin/stats/matches"),
        apiClient.get<HealthStats>("/admin/health"),
      ]);
      setDetails({
        userStats: userResponse.data,
        matchStats: matchResponse.data,
        healthStats: healthResponse.data,
      });
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect((): void => {
    void loadDetails();
  }, [loadDetails]);

  const registrationData = useMemo((): AreaChartDatum[] => mapAreaData(details.userStats?.registrationTimeline), [details.userStats]);
  const matchData = useMemo((): BarChartDatum[] => mapBarData(details.matchStats?.matchesPerDay), [details.matchStats]);
  const todaysMatches = details.matchStats?.matchesPerDay.at(-1)?.count ?? 0;
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const health = details.healthStats;

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Live Operations</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">COMMAND CENTER</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              void refetch();
              void loadDetails();
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-card px-4 text-xs font-black uppercase tracking-[0.16em] text-accent transition-colors hover:border-accent hover:bg-accent/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Sync
          </button>
        </header>

        <AdminErrorBoundary>
          {error && (
            <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">
              {error}
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Users" value={stats?.totalUsers ?? 0} trend={stats?.newUsersThisWeek ?? 0} trendLabel="new this week" icon={<Users className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Total Matches" value={stats?.totalMatches ?? 0} trend={todaysMatches} trendLabel="today" icon={<Swords className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Active Matches Now" value={stats?.activeMatches ?? 0} icon={<span className="relative flex"><Activity className="h-5 w-5 animate-pulse" /></span>} isLoading={isLoading} />
            <KpiCard title="Total Scripts" value={stats?.totalScripts ?? 0} icon={<FileCode2 className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <AreaChart data={registrationData} title="User Growth" height={chartHeight} isLoading={detailsLoading} />
            <BarChart data={matchData} title="Matches Per Day" height={chartHeight} isLoading={detailsLoading} />
          </section>

          <section className="mt-6">
            {detailsLoading ? (
              <ChartSkeleton height={isMobile ? 220 : 180} />
            ) : (
              <div className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">Platform Health</h2>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">Runtime telemetry and service readiness</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-accent">
                  <HeartPulse className="h-4 w-4 animate-pulse" />
                  Live
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-accent/15 bg-bg-primary p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">Database</p>
                  <p className="mt-2 text-lg font-black text-text-primary">{health?.dbHealthy ? "Online" : "Degraded"}</p>
                </div>
                <div className="rounded-lg border border-accent/15 bg-bg-primary p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">Redis</p>
                  <p className="mt-2 text-lg font-black text-text-primary">{health?.redisHealthy ? "Online" : "Degraded"}</p>
                </div>
                <div className="rounded-lg border border-accent/15 bg-bg-primary p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">Heap Used</p>
                  <p className="mt-2 text-lg font-black text-text-primary">{health ? formatMegabytes(health.memoryUsage.heapUsed) : "N/A"}</p>
                </div>
                <div className="rounded-lg border border-accent/15 bg-bg-primary p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">Uptime</p>
                  <p className="mt-2 text-lg font-black text-text-primary">{health ? formatUptime(health.uptimeSeconds) : "N/A"}</p>
                </div>
              </div>
              </div>
            )}
          </section>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
