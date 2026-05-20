"use client";

import { useMemo } from "react";
import { Bot, Coins, PackageOpen, Palette, Sparkles } from "lucide-react";
import { AdminErrorBoundary, BarChart, DonutChart, KpiCard, type BarChartDatum, type DonutChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminMarket, type HistogramBucket, type LabelCount } from "../hooks/useAdminMarket";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const DONUT_HEIGHT_DESKTOP = 300;
const DONUT_HEIGHT_MOBILE = 260;
const TOP_ITEMS_LIMIT = 10;
const DONUT_COLORS = ["var(--accent)", "var(--sem-success)", "var(--sem-warning)", "var(--sem-danger)", "var(--sem-info)"] as const;

function mapHistogramData(items: HistogramBucket[] | undefined): BarChartDatum[] {
  return (items ?? []).map((item) => ({ label: item.bucket, value: item.count }));
}

function mapLabelData(items: LabelCount[] | undefined): BarChartDatum[] {
  return (items ?? []).map((item) => ({ label: item.label, value: item.count }));
}

function mapDonutData(items: LabelCount[] | undefined): DonutChartDatum[] {
  return (items ?? []).map((item, index) => ({
    label: item.label,
    value: item.count,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));
}

export default function AdminMarketPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error } = useAdminMarket();
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const donutHeight = isMobile ? DONUT_HEIGHT_MOBILE : DONUT_HEIGHT_DESKTOP;
  const mostUnlockedItem = stats?.mostUnlockedItems[0]?.label ?? "N/A";
  const mostPopularChassis = stats?.popularChassis[0]?.label ?? "N/A";
  const pointsDistribution = useMemo((): BarChartDatum[] => mapHistogramData(stats?.pointsDistribution), [stats]);
  const unlockedItems = useMemo((): BarChartDatum[] => mapLabelData(stats?.mostUnlockedItems).slice(0, TOP_ITEMS_LIMIT), [stats]);
  const chassisData = useMemo((): DonutChartDatum[] => mapDonutData(stats?.popularChassis), [stats]);
  const paintData = useMemo((): DonutChartDatum[] => mapDonutData(stats?.popularPaints), [stats]);
  const tracerData = useMemo((): DonutChartDatum[] => mapDonutData(stats?.popularTracers), [stats]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Economy Signal</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">BLACK MARKET ECONOMY</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Points In Circulation" value={stats?.totalPointsInCirculation ?? 0} icon={<Coins className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Avg Points Per User" value={stats?.avgPointsPerUser ?? 0} icon={<Sparkles className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Most Unlocked Item" value={mostUnlockedItem} icon={<PackageOpen className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Most Popular Chassis" value={mostPopularChassis} icon={<Bot className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <BarChart data={pointsDistribution} title="Points Distribution" height={chartHeight} isLoading={isLoading} />
            <BarChart data={unlockedItems} title="Most Unlocked Items" horizontal height={chartHeight} isLoading={isLoading} color="var(--sem-success)" />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <DonutChart data={chassisData} title="Popular Chassis" height={donutHeight} isLoading={isLoading} />
            <DonutChart data={paintData} title="Popular Paints" height={donutHeight} isLoading={isLoading} />
            <DonutChart data={tracerData} title="Popular Tracers" height={donutHeight} isLoading={isLoading} />
          </section>
          <span className="sr-only"><Palette className="hidden" /> Market cosmetic preferences tracked</span>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
