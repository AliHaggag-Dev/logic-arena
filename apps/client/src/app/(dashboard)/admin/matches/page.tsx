"use client";

import { Clock3, Gamepad2, Swords, Trophy, Users } from "lucide-react";
import { BarChart, DonutChart, KpiCard, type BarChartDatum, type DonutChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminMatches } from "../hooks/useAdminMatches";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const SECONDS_PER_MINUTE = 60;

function mapDailyData(timeline: Array<{ date: string; count: number }> | undefined): BarChartDatum[] {
  return (timeline ?? []).map((item) => ({ label: item.date.slice(5), value: item.count }));
}

function mapLabelData(items: Array<{ label: string; count: number }> | undefined): BarChartDatum[] {
  return (items ?? []).map((item) => ({ label: item.label, value: item.count }));
}

function mapDonutData(items: Array<{ label: string; count: number }> | undefined): DonutChartDatum[] {
  return (items ?? []).map((item, index) => ({
    label: item.label,
    value: item.count,
    color: index % 2 === 0 ? "var(--accent)" : "var(--sem-info)",
  }));
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function AdminMatchesPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error } = useAdminMatches();
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const mostActivePlayer = stats?.mostActiveUsers[0]?.username ?? "N/A";
  const matchesPerDay = mapDailyData(stats?.matchesPerDay);
  const matchTypes = mapDonutData(stats?.matchTypeBreakdown);
  const statusBreakdown = mapLabelData(stats?.statusBreakdown);
  const activeUsers = (stats?.mostActiveUsers ?? []).map((user) => ({ label: user.username, value: user.matchCount }));

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Combat Telemetry</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">MATCH INTELLIGENCE</h1>
        </header>

        {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <KpiCard title="Total Matches" value={stats?.totalMatches ?? 0} icon={<Swords className="h-5 w-5" />} isLoading={isLoading} />
          <KpiCard title="Avg Duration" value={formatDuration(stats?.avgDuration ?? 0)} icon={<Clock3 className="h-5 w-5" />} isLoading={isLoading} />
          <KpiCard title="Most Active Player" value={mostActivePlayer} icon={<Trophy className="h-5 w-5" />} isLoading={isLoading} />
          <KpiCard title="Match Types" value={stats?.matchTypeBreakdown.length ?? 0} icon={<Gamepad2 className="h-5 w-5" />} isLoading={isLoading} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <BarChart data={matchesPerDay} title="Matches Per Day" height={chartHeight} isLoading={isLoading} />
          <DonutChart data={matchTypes} title="Match Type Mix" height={chartHeight} isLoading={isLoading} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <BarChart data={statusBreakdown} title="Status Breakdown" horizontal height={chartHeight} isLoading={isLoading} color="var(--sem-warning)" />
          <BarChart data={activeUsers} title="Most Active Users" horizontal height={chartHeight} isLoading={isLoading} color="var(--sem-success)" />
        </section>
      </div>
    </div>
  );
}
