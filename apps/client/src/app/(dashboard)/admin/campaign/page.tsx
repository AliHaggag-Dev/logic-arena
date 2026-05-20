"use client";

import { useMemo } from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flag, Gauge, ListChecks, Target, Trophy } from "lucide-react";
import { AdminErrorBoundary, BarChart, ChartSkeleton, KpiCard, type BarChartDatum } from "@/components/admin";
import { useAdminViewport } from "../components/AdminViewportContext";
import { useAdminCampaign, type LevelCompletionRate } from "../hooks/useAdminCampaign";

const COMPACT_CHART_HEIGHT_DESKTOP = 320;
const COMPACT_CHART_HEIGHT_MOBILE = 260;
const LEVEL_CHART_HEIGHT_DESKTOP = 900;
const LEVEL_CHART_HEIGHT_MOBILE = 760;
const TOTAL_LEVELS = 60;
const LEVELS_PER_TAB = 10;
const TOP_HARDEST_LIMIT = 10;
const FUNNEL_THRESHOLDS = [1, 5, 10, 20, 40, 60] as const;
const GRID_OPACITY = 0.14;
const BAR_RADIUS = 6;

type CampaignDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

interface LevelMeta {
  levelId: string;
  difficulty: CampaignDifficulty;
}

interface LevelChartDatum {
  label: string;
  value: number;
  difficulty: CampaignDifficulty;
  color: string;
  completions: number;
}

const LEVEL_PREFIXES = ["cond", "loop", "arr", "ds", "rec", "gfx"] as const;
const DIFFICULTY_COLORS: Record<CampaignDifficulty, string> = {
  EASY: "var(--sem-success)",
  MEDIUM: "var(--sem-warning)",
  HARD: "color-mix(in srgb, var(--sem-warning) 65%, var(--sem-danger))",
  EXTREME: "var(--sem-danger)",
};

function getDifficulty(prefix: string, levelNumber: number): CampaignDifficulty {
  if (prefix === "ds") {
    if (levelNumber <= 3) return "MEDIUM";
    if (levelNumber <= 7) return "HARD";
    return "EXTREME";
  }

  if (levelNumber <= 2) return "EASY";
  if (levelNumber <= 5) return "MEDIUM";
  if (levelNumber <= 8) return "HARD";
  return "EXTREME";
}

function buildLevelCatalog(): LevelMeta[] {
  return LEVEL_PREFIXES.flatMap((prefix) =>
    Array.from({ length: LEVELS_PER_TAB }, (_, index) => {
      const levelNumber = index + 1;
      return {
        levelId: `${prefix}-${String(levelNumber).padStart(2, "0")}`,
        difficulty: getDifficulty(prefix, levelNumber),
      };
    }),
  );
}

function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatTooltipRate(value: unknown): string {
  return typeof value === "number" ? formatRate(value) : String(value ?? "");
}

function mapLevelData(rates: LevelCompletionRate[] | undefined): LevelChartDatum[] {
  const rateMap = new Map((rates ?? []).map((rate) => [rate.levelId, rate]));

  return buildLevelCatalog().map((level) => {
    const rate = rateMap.get(level.levelId);
    return {
      label: level.levelId,
      value: rate?.completionRate ?? 0,
      difficulty: level.difficulty,
      color: DIFFICULTY_COLORS[level.difficulty],
      completions: rate?.completionCount ?? 0,
    };
  });
}

function findHardest(levels: LevelChartDatum[]): LevelChartDatum | undefined {
  return [...levels].sort((left, right) => left.value - right.value || left.label.localeCompare(right.label))[0];
}

function findEasiest(levels: LevelChartDatum[]): LevelChartDatum | undefined {
  return [...levels].sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))[0];
}

interface LevelCompletionChartProps {
  data: LevelChartDatum[];
  height: number;
  isLoading: boolean;
}

function LevelCompletionChart({ data, height, isLoading }: LevelCompletionChartProps): React.ReactElement {
  if (isLoading) return <ChartSkeleton height={height} />;

  return (
    <section className="rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] [&_.recharts-layer:focus]:outline-none [&_.recharts-rectangle:focus]:outline-none [&_*:focus]:outline-none md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">Level Completion Rates</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIFFICULTY_COLORS) as CampaignDifficulty[]).map((difficulty) => (
            <span key={difficulty} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS[difficulty] }} />
              {difficulty}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 md:mt-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} layout="vertical">
            <CartesianGrid stroke="var(--border)" strokeOpacity={GRID_OPACITY} vertical horizontal={false} />
            <XAxis type="number" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
            <YAxis type="category" dataKey="label" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={11} width={72} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} cursor={{ fill: "rgba(var(--accent-rgb),0.08)", strokeWidth: 0 }} formatter={formatTooltipRate} />
            <Bar dataKey="value" radius={BAR_RADIUS} activeBar={false}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} strokeWidth={0} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function AdminCampaignPage(): React.ReactElement {
  const { isMobile } = useAdminViewport();
  const { stats, isLoading, error } = useAdminCampaign();
  const compactChartHeight = isMobile ? COMPACT_CHART_HEIGHT_MOBILE : COMPACT_CHART_HEIGHT_DESKTOP;
  const levelChartHeight = isMobile ? LEVEL_CHART_HEIGHT_MOBILE : LEVEL_CHART_HEIGHT_DESKTOP;
  const levelData = useMemo((): LevelChartDatum[] => mapLevelData(stats?.levelCompletionRates), [stats]);
  const hardestLevel = findHardest(levelData);
  const easiestLevel = findEasiest(levelData);
  const totalCompletions = levelData.reduce((sum, level) => sum + level.completions, 0);
  const funnelData: BarChartDatum[] = FUNNEL_THRESHOLDS.map((threshold) => ({
    label: `${threshold}+`,
    value: stats?.progressionFunnel.find((step) => step.completedAtLeast === threshold)?.userCount ?? 0,
  }));
  const hardestLevels = [...levelData]
    .sort((left, right) => left.value - right.value || left.label.localeCompare(right.label))
    .slice(0, TOP_HARDEST_LIMIT);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="relative z-10">
        <header className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent/70">Mission Progression</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-text-primary md:text-5xl">CAMPAIGN ANALYTICS</h1>
        </header>

        <AdminErrorBoundary>
          {error && <section className="mb-6 rounded-lg border border-[var(--sem-danger)] bg-card p-4 text-sm font-bold text-[var(--sem-danger)]">{error}</section>}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <KpiCard title="Engagement Rate" value={formatRate(stats?.campaignEngagementRate ?? 0)} icon={<Flag className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Total Completions" value={totalCompletions} icon={<ListChecks className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Hardest Level" value={hardestLevel ? hardestLevel.label : "N/A"} icon={<Target className="h-5 w-5" />} isLoading={isLoading} />
            <KpiCard title="Easiest Level" value={easiestLevel ? easiestLevel.label : "N/A"} icon={<Trophy className="h-5 w-5" />} isLoading={isLoading} />
          </section>

          <section className="mt-6">
            <LevelCompletionChart data={levelData} height={levelChartHeight} isLoading={isLoading} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <BarChart data={funnelData} title="Progression Funnel" horizontal height={compactChartHeight} isLoading={isLoading} color="var(--accent)" />
            {isLoading ? (
              <ChartSkeleton height={compactChartHeight} />
            ) : (
              <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-sm font-black uppercase tracking-widest text-text-primary">Hardest Levels</h3>
                <Gauge className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-5 grid gap-2">
                {hardestLevels.map((level, index) => (
                  <div key={level.label} className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-accent/15 bg-bg-primary px-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-7 text-xs font-black text-text-secondary">#{index + 1}</span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: level.color }} />
                      <span className="truncate text-sm font-black uppercase tracking-widest text-text-primary">{level.label}</span>
                    </div>
                    <span className="text-sm font-black text-accent">{formatRate(level.value)}</span>
                  </div>
                ))}
              </div>
              </section>
            )}
          </section>
          <span className="sr-only">{TOTAL_LEVELS} campaign levels tracked</span>
        </AdminErrorBoundary>
      </div>
    </div>
  );
}
