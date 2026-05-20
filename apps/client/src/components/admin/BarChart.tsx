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
import { useAdminViewport } from "@/app/(dashboard)/admin/components/AdminViewportContext";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_BAR_HEIGHT = 320;
const MOBILE_BAR_HEIGHT = 220;
const MOBILE_POINTS_LIMIT = 7;
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
  const { isMobile } = useAdminViewport();
  const chartHeight = isMobile ? Math.max(MOBILE_BAR_HEIGHT, 200) : height;
  const chartData = isMobile ? data.slice(0, MOBILE_POINTS_LIMIT) : data;

  if (isLoading) {
    return <ChartSkeleton height={chartHeight} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] [&_.recharts-layer:focus]:outline-none [&_.recharts-rectangle:focus]:outline-none [&_*:focus]:outline-none md:p-5">
      <h3 className="font-mono text-xs font-black uppercase tracking-widest text-text-primary md:text-sm">{title}</h3>
      <div className="mt-4 min-h-[200px] md:mt-5" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} layout={horizontal ? "vertical" : "horizontal"}>
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
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} cursor={{ fill: "rgba(var(--accent-rgb),0.08)", strokeWidth: 0 }} />
            <Bar dataKey="value" fill={color} radius={BAR_RADIUS} activeBar={false} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
