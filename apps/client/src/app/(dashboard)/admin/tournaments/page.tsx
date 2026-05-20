"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock3, LoaderCircle, Trophy, UsersRound } from "lucide-react";
import { AdminErrorBoundary, BarChart, DonutChart, KpiCard, type BarChartDatum, type DonutChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminTournaments } from "../hooks/useAdminTournaments";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const TOP_WINNERS_LIMIT = 5;

export default function AdminTournamentsPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error } = useAdminTournaments();
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const statusBreakdown = useMemo((): DonutChartDatum[] => [
    { label: "Waiting", value: stats?.byStatus.waiting ?? 0, color: "var(--sem-warning)" },
    { label: "In Progress", value: stats?.byStatus.inProgress ?? 0, color: "var(--sem-info)" },
    { label: "Completed", value: stats?.byStatus.completed ?? 0, color: "var(--sem-success)" },
  ], [stats]);
  const tournamentWins = useMemo((): BarChartDatum[] => (
    (stats?.mostWins ?? []).slice(0, TOP_WINNERS_LIMIT).map((winner) => ({
      label: winner.username,
      value: winner.winCount,
    }))
  ), [stats]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Bracket Control</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">TOURNAMENT ANALYTICS</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Tournaments" value={stats?.total ?? 0} icon={<Trophy className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Completed" value={stats?.byStatus.completed ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="In Progress" value={stats?.byStatus.inProgress ?? 0} icon={<LoaderCircle className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Waiting" value={stats?.byStatus.waiting ?? 0} icon={<Clock3 className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <DonutChart data={statusBreakdown} title="Status Breakdown" height={chartHeight} isLoading={isLoading} />
            <BarChart data={tournamentWins} title="Most Tournament Wins" horizontal height={chartHeight} isLoading={isLoading} color="var(--sem-success)" />
          </section>
          <span className="sr-only"><UsersRound className="hidden" /> Tournament player wins tracked</span>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
