"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminViewport } from "@/app/(dashboard)/admin/components/AdminViewportContext";
import { ChartSkeleton } from "./AdminSkeleton";

const DEFAULT_AREA_HEIGHT = 320;
const MOBILE_AREA_HEIGHT = 220;
const DEFAULT_CHART_COLOR = "var(--accent)";
const AREA_STROKE_WIDTH = 2;
const AREA_FILL_OPACITY = 0.22;
const GRID_OPACITY = 0.14;
const RANGE_OPTIONS = [7, 30, 90] as const;

type RangeOption = (typeof RANGE_OPTIONS)[number];

export interface AreaChartDatum {
  date: string;
  value: number;
}

export interface AreaChartProps {
  data: AreaChartDatum[];
  title: string;
  color?: string;
  height?: number;
  isLoading?: boolean;
}

export function AreaChart({ data, title, color = DEFAULT_CHART_COLOR, height = DEFAULT_AREA_HEIGHT, isLoading = false }: AreaChartProps): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const [range, setRange] = useState<RangeOption>(RANGE_OPTIONS[1]);
  const gradientId = useMemo((): string => `area-gradient-${title.replace(/\W+/g, "-").toLowerCase()}`, [title]);
  const filteredData = useMemo((): AreaChartDatum[] => data.slice(-range), [data, range]);
  const chartHeight = isMobile ? Math.max(MOBILE_AREA_HEIGHT, 200) : height;

  useEffect((): void => {
    if (isMobile) {
      setRange(RANGE_OPTIONS[0]);
    }
  }, [isMobile]);

  if (isLoading) {
    return <ChartSkeleton height={chartHeight} />;
  }

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest text-text-primary md:text-sm">{title}</h3>
        <div className="flex overflow-x-auto rounded-lg border border-accent/20 bg-bg-primary p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`min-h-8 rounded px-3 font-mono text-xs font-bold transition-colors ${range === option ? "bg-accent/20 text-accent" : "text-text-secondary hover:bg-accent/10 hover:text-text-primary"}`}
            >
              {option}D
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 min-h-[200px] md:mt-5" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={filteredData}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={AREA_FILL_OPACITY} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeOpacity={GRID_OPACITY} vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} width={44} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={AREA_STROKE_WIDTH} fill={`url(#${gradientId})`} />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
