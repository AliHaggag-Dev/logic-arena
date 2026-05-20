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
import { useAdminViewport } from "@/app/(dashboard)/admin/components/AdminViewportContext";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_LINE_HEIGHT = 320;
const MOBILE_LINE_HEIGHT = 220;
const MOBILE_POINTS_LIMIT = 7;
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
  const { isMobile } = useAdminViewport();
  const chartHeight = isMobile ? Math.max(MOBILE_LINE_HEIGHT, 200) : height;
  const chartData = isMobile ? data.slice(-MOBILE_POINTS_LIMIT) : data;

  if (isLoading) {
    return <ChartSkeleton height={chartHeight} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] [&_.recharts-layer:focus]:outline-none [&_.recharts-symbols:focus]:outline-none [&_*:focus]:outline-none md:p-5">
      <h3 className="font-mono text-xs font-black uppercase tracking-widest text-text-primary md:text-sm">{title}</h3>
      <div className="mt-4 min-h-[200px] md:mt-5" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartData}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={GRID_OPACITY} vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} width={44} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} cursor={{ stroke: "rgba(var(--accent-rgb),0.2)", strokeWidth: 1 }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={LINE_STROKE_WIDTH} dot={{ r: DOT_RADIUS, fill: color, strokeWidth: 0 }} activeDot={{ r: DOT_RADIUS + 1, strokeWidth: 0 }} />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
