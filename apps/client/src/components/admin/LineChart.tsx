"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_LINE_HEIGHT = 320;
const DEFAULT_CHART_COLOR = "var(--accent)";
const LINE_STROKE_WIDTH = 2;
const GRID_OPACITY = 0.14;
const DOT_RADIUS = 3;

export interface LineChartDatum {
  date: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartDatum[];
  title: string;
  color?: string;
  height?: number;
  isLoading?: boolean;
}

export function LineChart({ data, title, color = DEFAULT_CHART_COLOR, height = DEFAULT_LINE_HEIGHT, isLoading = false }: LineChartProps): React.ReactElement {
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
      <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">{title}</h3>
      <div className="mt-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={GRID_OPACITY} vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} width={44} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={LINE_STROKE_WIDTH} dot={{ r: DOT_RADIUS, fill: color }} activeDot={{ r: DOT_RADIUS + 1 }} />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
