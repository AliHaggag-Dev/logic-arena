"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_BAR_HEIGHT = 320;
const DEFAULT_CHART_COLOR = "var(--accent)";
const BAR_RADIUS = 6;
const GRID_OPACITY = 0.14;

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  title: string;
  color?: string;
  horizontal?: boolean;
  height?: number;
  isLoading?: boolean;
}

export function BarChart({ data, title, color = DEFAULT_CHART_COLOR, horizontal = false, height = DEFAULT_BAR_HEIGHT, isLoading = false }: BarChartProps): React.ReactElement {
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
      <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">{title}</h3>
      <div className="mt-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} layout={horizontal ? "vertical" : "horizontal"}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={GRID_OPACITY} vertical={horizontal} horizontal={!horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="label" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} width={96} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} width={44} />
              </>
            )}
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} cursor={{ fill: "rgba(var(--accent-rgb),0.08)" }} />
            <Bar dataKey="value" fill={color} radius={BAR_RADIUS} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
