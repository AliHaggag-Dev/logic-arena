"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { KpiCardSkeleton } from "./AdminSkeleton";

const COUNTER_DURATION_MS = 900;
const FRAME_FALLBACK_MS = 16;
const FRACTION_DIGITS = 1;

export interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  isLoading?: boolean;
}

function formatAnimatedValue(currentValue: number, targetValue: number): string {
  if (Number.isInteger(targetValue)) {
    return Math.round(currentValue).toLocaleString();
  }

  return currentValue.toLocaleString(undefined, {
    maximumFractionDigits: FRACTION_DIGITS,
    minimumFractionDigits: FRACTION_DIGITS,
  });
}

export function KpiCard({ title, value, trend, trendLabel, icon, isLoading = false }: KpiCardProps): React.ReactElement {
  const numericValue = typeof value === "number" ? value : Number.NaN;
  const [displayValue, setDisplayValue] = useState<string>(typeof value === "number" ? "0" : String(value));

  useEffect((): (() => void) | undefined => {
    if (typeof value !== "number") {
      setDisplayValue(String(value));
      return undefined;
    }

    let animationFrameId = 0;
    let startTime: number | undefined;

    const updateCounter = (timestamp: number): void => {
      startTime ??= timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(formatAnimatedValue(value * easedProgress, value));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(updateCounter);
      }
    };

    animationFrameId = window.requestAnimationFrame(updateCounter);

    return (): void => {
      window.cancelAnimationFrame(animationFrameId || FRAME_FALLBACK_MS);
    };
  }, [value]);

  const trendState = useMemo((): "positive" | "negative" | "neutral" => {
    if (trend === undefined || trend === 0) {
      return "neutral";
    }

    return trend > 0 ? "positive" : "negative";
  }, [trend]);

  if (isLoading) {
    return <KpiCardSkeleton />;
  }

  return (
    <section className="group relative overflow-hidden rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-accent/50 md:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-60" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary md:tracking-widest">{title}</p>
          <p className="mt-3 font-mono text-3xl font-black text-text-primary [text-shadow:0_0_16px_rgba(var(--accent-rgb),0.25)]">
            {Number.isNaN(numericValue) ? displayValue : displayValue}
          </p>
        </div>
        {icon && (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent [&_svg]:h-8 [&_svg]:w-8 md:h-11 md:w-11 md:[&_svg]:h-5 md:[&_svg]:w-5">
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span
            className={
              trendState === "positive"
                ? "inline-flex items-center gap-1 rounded-full border border-[rgba(var(--sem-success-rgb),0.28)] bg-[rgba(var(--sem-success-rgb),0.10)] px-2 py-1 text-[var(--sem-success)]"
                : trendState === "negative"
                  ? "inline-flex items-center gap-1 rounded-full border border-[rgba(var(--sem-danger-rgb),0.28)] bg-[rgba(var(--sem-danger-rgb),0.10)] px-2 py-1 text-[var(--sem-danger)]"
                  : "inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/5 px-2 py-1 text-text-secondary"
            }
          >
            {trendState === "negative" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            {Math.abs(trend).toLocaleString()}%
          </span>
          {trendLabel && <span className="text-text-secondary">{trendLabel}</span>}
        </div>
      )}
    </section>
  );
}
