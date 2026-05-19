"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_DONUT_HEIGHT = 320;
const OUTER_RADIUS = 96;
const INNER_RADIUS = 58;
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
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
      <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">{title}</h3>
      <div className="mt-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={INNER_RADIUS} outerRadius={OUTER_RADIUS} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
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
