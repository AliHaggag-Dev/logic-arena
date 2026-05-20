"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Cpu, Database, HardDrive, MemoryStick, RefreshCcw, Server, Timer, Wifi } from "lucide-react";
import { AdminErrorBoundary, ChartSkeleton, GaugeWidget, KpiCard, KpiCardSkeleton, StatusIndicator } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminHealth } from "../hooks/useAdminHealth";
import { ADMIN_STAGGER_DELAY_MS } from "../hooks/adminRequest";

const BYTES_PER_MEGABYTE = 1_048_576;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;
const PERCENT_MULTIPLIER = 100;
const RELATIVE_TIME_REFRESH_MS = 1_000;
const GRID_SIZE_PX = 48;
const MEMORY_SKELETON_HEIGHT_MOBILE = 220;
const MEMORY_SKELETON_HEIGHT_DESKTOP = 260;

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / BYTES_PER_MEGABYTE).toLocaleString()} MB`;
}

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return `${days.toLocaleString()} days, ${hours} hours, ${minutes} mins`;
}

function formatSecondsAgo(value: Date | null, now: Date): string {
  if (value === null) return "Waiting for sync";
  const seconds = Math.max(Math.floor((now.getTime() - value.getTime()) / RELATIVE_TIME_REFRESH_MS), 0);
  return `Last updated ${seconds.toLocaleString()} seconds ago`;
}

function calculateHeapPercent(heapUsed: number, heapTotal: number): number {
  if (heapTotal <= 0) return 0;
  return (heapUsed / heapTotal) * PERCENT_MULTIPLIER;
}

export default function AdminHealthPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { health, isLoading, error, lastUpdated, refetch } = useAdminHealth({ initialDelayMs: ADMIN_STAGGER_DELAY_MS });
  const [now, setNow] = useState<Date>(new Date());

  useEffect((): (() => void) => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, RELATIVE_TIME_REFRESH_MS);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, []);

  const heapPercent = useMemo((): number => {
    if (!health) return 0;
    return calculateHeapPercent(health.memoryUsage.heapUsed, health.memoryUsage.heapTotal);
  }, [health]);

  const hasServiceWarning = Boolean(health && (!health.redisHealthy || !health.dbHealthy));

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)",
          backgroundSize: `${GRID_SIZE_PX}px ${GRID_SIZE_PX}px`,
        }}
      />
      <div className="relative z-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Runtime Telemetry</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">SERVER HEALTH</h1>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-card px-4 text-xs font-black uppercase tracking-[0.16em] text-accent transition-colors hover:border-accent hover:bg-accent/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Sync
            </button>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">{formatSecondsAgo(lastUpdated, now)}</p>
          </div>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          {hasServiceWarning && (
            <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.12)] p-4 text-sm font-black uppercase tracking-[0.12em] text-[var(--sem-danger)]">
              Critical service dependency is down
            </section>
          )}

          <section className="grid gap-3 md:grid-cols-3 md:gap-4">
            {isLoading ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <>
                <div className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                    <Database className="h-5 w-5" />
                  </div>
                  <StatusIndicator status={health?.dbHealthy ? "healthy" : "down"} label={health?.dbHealthy ? "Database Healthy" : "Database Down"} />
                </div>
                <div className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <StatusIndicator status={health?.redisHealthy ? "healthy" : "down"} label={health?.redisHealthy ? "Redis Healthy" : "Redis Down"} />
                </div>
                <KpiCard title="Server Uptime" value={health ? formatUptime(health.uptimeSeconds) : "N/A"} icon={<Timer className="h-5 w-5" />} />
              </>
            )}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <ChartSkeleton height={isMobile ? MEMORY_SKELETON_HEIGHT_MOBILE : MEMORY_SKELETON_HEIGHT_DESKTOP} />
                <ChartSkeleton height={isMobile ? MEMORY_SKELETON_HEIGHT_MOBILE : MEMORY_SKELETON_HEIGHT_DESKTOP} />
              </>
            ) : (
              <>
                <GaugeWidget value={heapPercent} title="HEAP USAGE" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                  <KpiCard title="RSS" value={health ? formatMegabytes(health.memoryUsage.rss) : "N/A"} icon={<HardDrive className="h-5 w-5" />} />
                  <KpiCard title="Heap Used" value={health ? formatMegabytes(health.memoryUsage.heapUsed) : "N/A"} icon={<MemoryStick className="h-5 w-5" />} />
                  <KpiCard title="Heap Total" value={health ? formatMegabytes(health.memoryUsage.heapTotal) : "N/A"} icon={<Cpu className="h-5 w-5" />} />
                </div>
              </>
            )}
          </section>

          <section className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
            <KpiCard title="Node.js Version" value={health?.nodeVersion ?? "N/A"} icon={<Server className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Process Uptime" value={health ? formatUptime(health.uptimeSeconds) : "N/A"} icon={<Activity className="h-5 w-5" />} isLoading={isLoading} />
          </section>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
