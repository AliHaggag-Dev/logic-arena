"use client";

import { useMemo } from "react";
import { FileCode2, GitBranch, Ruler, ScrollText } from "lucide-react";
import { AdminErrorBoundary, BarChart, KpiCard, type BarChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminScripts, type HistogramBucket } from "../hooks/useAdminScripts";

const CHART_HEIGHT_DESKTOP = 320;
const CHART_HEIGHT_MOBILE = 260;
const TOP_REVISED_LIMIT = 10;
const RANGE_PARTS = 2;

function mapHistogramData(items: HistogramBucket[] | undefined): BarChartDatum[] {
  return (items ?? []).map((item) => ({ label: item.bucket, value: item.count }));
}

function getBucketMidpoint(bucket: string): number {
  const values = bucket.match(/\d+/g)?.map(Number) ?? [];
  if (values.length < RANGE_PARTS) return values[0] ?? 0;
  return (values[0] + values[1]) / RANGE_PARTS;
}

function estimateAverageLength(items: HistogramBucket[] | undefined): number {
  const buckets = items ?? [];
  const totalScripts = buckets.reduce((sum, item) => sum + item.count, 0);
  if (totalScripts <= 0) return 0;

  const weightedLength = buckets.reduce((sum, item) => sum + getBucketMidpoint(item.bucket) * item.count, 0);
  return Math.round(weightedLength / totalScripts);
}

export default function AdminScriptsPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error } = useAdminScripts();
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP;
  const mostRevisedScript = stats?.mostRevisedScripts[0];
  const mostRevisedLabel = mostRevisedScript ? `${mostRevisedScript.title} v${mostRevisedScript.version}` : "N/A";
  const averageScriptLength = estimateAverageLength(stats?.scriptLengthDistribution);
  const lengthDistribution = useMemo((): BarChartDatum[] => mapHistogramData(stats?.scriptLengthDistribution), [stats]);
  const revisedScripts = useMemo((): BarChartDatum[] => (
    (stats?.mostRevisedScripts ?? []).slice(0, TOP_REVISED_LIMIT).map((script) => ({
      label: script.title,
      value: script.version,
    }))
  ), [stats]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Code Telemetry</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">SCRIPTS ANALYTICS</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Total Scripts" value={stats?.totalScripts ?? 0} icon={<FileCode2 className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Avg Scripts Per User" value={stats?.avgScriptsPerUser ?? 0} icon={<ScrollText className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Most Revised Script" value={mostRevisedLabel} icon={<GitBranch className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Avg Script Length" value={`${averageScriptLength.toLocaleString()} chars`} icon={<Ruler className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <BarChart data={lengthDistribution} title="Script Length Distribution" height={chartHeight} isLoading={isLoading} />
            <BarChart data={revisedScripts} title="Most Revised Scripts" horizontal height={chartHeight} isLoading={isLoading} color="var(--sem-info)" />
          </section>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
