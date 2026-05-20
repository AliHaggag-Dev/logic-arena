"use client";

import { useMemo } from "react";
import { Brain, Eye, EyeOff, Lightbulb, Users } from "lucide-react";
import { AdminErrorBoundary, ChartSkeleton, DonutChart, KpiCard, ProgressRing, type DonutChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminAI, type LabelCount } from "../hooks/useAdminAI";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const RING_SIZE_DESKTOP = 156;
const RING_SIZE_MOBILE = 128;
const FULL_PERCENT = 100;
const DONUT_COLORS = ["var(--accent)", "var(--sem-success)", "var(--sem-warning)", "var(--sem-danger)", "var(--sem-info)"] as const;

function formatPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * FULL_PERCENT);
}

function mapDonutData(items: LabelCount[] | undefined): DonutChartDatum[] {
  return (items ?? []).map((item, index) => ({
    label: item.label,
    value: item.count,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));
}

export default function AdminAIInsightsPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error } = useAdminAI();
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const ringSize = isMobile ? RING_SIZE_MOBILE : RING_SIZE_DESKTOP;
  const readPercent = formatPercent(stats?.readCount ?? 0, stats?.totalInsights ?? 0);
  const categoryData = useMemo((): DonutChartDatum[] => mapDonutData(stats?.categoryBreakdown), [stats]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Aria Signal</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">AI INSIGHTS ANALYTICS</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Insights Generated" value={stats?.totalInsights ?? 0} icon={<Brain className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Read Count" value={stats?.readCount ?? 0} icon={<Eye className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Unread Count" value={stats?.unreadCount ?? 0} icon={<EyeOff className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Avg Insights Per User" value={stats?.avgInsightsPerUser ?? 0} icon={<Users className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <ChartSkeleton height={chartHeight} />
            ) : (
              <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">Read vs Unread</h3>
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-5 flex flex-col items-center justify-center gap-5" style={{ minHeight: chartHeight }}>
                <ProgressRing value={readPercent} label="Read" size={ringSize} color="var(--sem-success)" />
                <div className="grid w-full grid-cols-2 gap-3">
                  <div className="rounded-lg border border-accent/15 bg-bg-primary p-3 text-center">
                    <p className="font-mono text-[10px] font-black uppercase tracking-widest text-text-secondary">Read</p>
                    <p className="mt-1 font-mono text-xl font-black text-[var(--sem-success)]">{(stats?.readCount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-accent/15 bg-bg-primary p-3 text-center">
                    <p className="font-mono text-[10px] font-black uppercase tracking-widest text-text-secondary">Unread</p>
                    <p className="mt-1 font-mono text-xl font-black text-[var(--sem-warning)]">{(stats?.unreadCount ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              </section>
            )}
            <DonutChart data={categoryData} title="Category Breakdown" height={chartHeight} isLoading={isLoading} />
          </section>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
