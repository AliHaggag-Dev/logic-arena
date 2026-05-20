"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAdminViewport } from "@/app/(dashboard)/admin/components/AdminViewportContext";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_DONUT_HEIGHT = 320;
const MOBILE_DONUT_HEIGHT = 240;
const OUTER_RADIUS = 96;
const INNER_RADIUS = 58;
const MOBILE_OUTER_RADIUS = 74;
const MOBILE_INNER_RADIUS = 46;
const FALLBACK_COLORS = ["var(--accent)", "var(--sem-success)", "var(--sem-warning)", "var(--sem-danger)", "var(--sem-info)"] as const;

export interface DonutChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  title: string;
  height?: number;
  isLoading?: boolean;
}

export function DonutChart({ data, title, height = DEFAULT_DONUT_HEIGHT, isLoading = false }: DonutChartProps): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const chartHeight = isMobile ? Math.max(MOBILE_DONUT_HEIGHT, 200) : height;
  const outerRadius = isMobile ? MOBILE_OUTER_RADIUS : OUTER_RADIUS;
  const innerRadius = isMobile ? MOBILE_INNER_RADIUS : INNER_RADIUS;

  if (isLoading) {
    return <ChartSkeleton height={chartHeight} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] [&_.recharts-layer:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_*:focus]:outline-none md:p-5">
      <h3 className="font-mono text-xs font-black uppercase tracking-widest text-text-primary md:text-sm">{title}</h3>
      <div className="mt-4 min-h-[200px] md:mt-5" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2} activeShape={false}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {data.map((entry, index) => (
          <div key={entry.label} className="flex items-center gap-2 font-mono text-xs text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] }} />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
