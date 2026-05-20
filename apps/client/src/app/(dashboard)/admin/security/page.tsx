"use client";

import { useMemo } from "react";
import { KeyRound, ShieldCheck, UserCheck, Users } from "lucide-react";
import { AdminErrorBoundary, AreaChart, ChartSkeleton, DonutChart, KpiCard, ProgressRing, type AreaChartDatum, type DonutChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAdminUserStats } from "../hooks/useAdminUsers";
import { ADMIN_STAGGER_DELAY_MS } from "../hooks/adminRequest";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const PERCENT_MULTIPLIER = 100;
const GRID_SIZE_PX = 48;
const RING_SIZE_DESKTOP = 168;
const RING_SIZE_MOBILE = 144;
const PROGRESS_PANEL_HEIGHT = 320;

function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * PERCENT_MULTIPLIER)}%`;
}

function calculatePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return (value / total) * PERCENT_MULTIPLIER;
}

function mapAreaData(timeline: Array<{ date: string; count: number }> | undefined): AreaChartDatum[] {
  return (timeline ?? []).map((item) => ({ date: item.date.slice(5), value: item.count }));
}

export default function AdminSecurityPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats: overviewStats, isLoading: overviewLoading, error: overviewError } = useAdminStats();
  const { stats: userStats, isLoading: userStatsLoading, error: userStatsError } = useAdminUserStats({ initialDelayMs: ADMIN_STAGGER_DELAY_MS });

  const totalUsers = userStats?.totalUsers ?? overviewStats?.totalUsers ?? 0;
  const localUsers = userStats?.providerBreakdown.local ?? 0;
  const googleUsers = userStats?.providerBreakdown.google ?? 0;
  const githubUsers = userStats?.providerBreakdown.github ?? 0;
  const oauthUsers = googleUsers + githubUsers;
  const verifiedCount = userStats?.verifiedCount ?? 0;
  const verifiedPercent = calculatePercent(verifiedCount, totalUsers);
  const isLoading = overviewLoading || userStatsLoading;
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;

  const providerData = useMemo((): DonutChartDatum[] => [
    { label: "Local", value: localUsers, color: "var(--accent)" },
    { label: "Google", value: googleUsers, color: "var(--sem-success)" },
    { label: "GitHub", value: githubUsers, color: "var(--sem-info)" },
  ], [githubUsers, googleUsers, localUsers]);

  const registrationData = useMemo((): AreaChartDatum[] => mapAreaData(userStats?.registrationTimeline), [userStats]);

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)",
          backgroundSize: `${GRID_SIZE_PX}px ${GRID_SIZE_PX}px`,
        }}
      />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Identity Telemetry</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">AUTH &amp; SECURITY</h1>
        </header>

        <AdminErrorBoundary>
          {(overviewError || userStatsError) && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{overviewError ?? userStatsError}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Users" value={totalUsers} icon={<Users className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Verified Users %" value={formatPercent(verifiedCount, totalUsers)} icon={<ShieldCheck className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="OAuth Users %" value={formatPercent(oauthUsers, totalUsers)} icon={<UserCheck className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Local Auth Users %" value={formatPercent(localUsers, totalUsers)} icon={<KeyRound className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <DonutChart data={providerData} title="Auth Provider" height={chartHeight} isLoading={isLoading} />
            {isLoading ? (
              <ChartSkeleton height={chartHeight} />
            ) : (
              <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
              <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">Verification Status</h3>
              <div className="flex items-center justify-center" style={{ height: PROGRESS_PANEL_HEIGHT }}>
                <ProgressRing value={verifiedPercent} label="Verified" size={isMobile ? RING_SIZE_MOBILE : RING_SIZE_DESKTOP} color="var(--sem-success)" />
              </div>
              </section>
            )}
          </section>

          <section className="mt-6">
            <AreaChart data={registrationData} title="Registration Timeline" height={chartHeight} isLoading={isLoading} />
          </section>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
