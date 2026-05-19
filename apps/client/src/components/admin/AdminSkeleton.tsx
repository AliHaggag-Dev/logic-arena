"use client";

const DEFAULT_CHART_HEIGHT = 320;
const DEFAULT_TABLE_ROWS = 5;
const TABLE_SKELETON_COLUMNS = 4;

interface ChartSkeletonProps {
  height?: number;
}

interface TableSkeletonProps {
  rows?: number;
}

const shimmerClassName =
  "animate-[shimmer_1.8s_linear_infinite] bg-[linear-gradient(90deg,rgba(var(--accent-rgb),0.06),rgba(var(--accent-rgb),0.18),rgba(var(--accent-rgb),0.06))] bg-[length:200%_100%]";

export function KpiCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
      <div className={`${shimmerClassName} h-3 w-28 rounded`} />
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className={`${shimmerClassName} h-9 w-32 rounded`} />
        <div className={`${shimmerClassName} h-10 w-10 rounded-lg`} />
      </div>
      <div className={`${shimmerClassName} mt-4 h-4 w-24 rounded`} />
    </div>
  );
}

export function ChartSkeleton({ height = DEFAULT_CHART_HEIGHT }: ChartSkeletonProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-accent/20 bg-card p-5 shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between gap-4">
        <div className={`${shimmerClassName} h-4 w-36 rounded`} />
        <div className={`${shimmerClassName} h-8 w-32 rounded`} />
      </div>
      <div
        className={`${shimmerClassName} mt-5 rounded-lg border border-accent/10`}
        style={{ height }}
      />
    </div>
  );
}

export function TableSkeleton({ rows = DEFAULT_TABLE_ROWS }: TableSkeletonProps): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-lg border border-accent/20 bg-card shadow-[var(--card-shadow)]">
      <div className="grid gap-4 border-b border-accent/20 bg-accent/5 p-4" style={{ gridTemplateColumns: `repeat(${TABLE_SKELETON_COLUMNS}, minmax(0, 1fr))` }}>
        {Array.from({ length: TABLE_SKELETON_COLUMNS }, (_, index) => (
          <div key={`heading-${index}`} className={`${shimmerClassName} h-3 rounded`} />
        ))}
      </div>
      <div className="divide-y divide-accent/10">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${TABLE_SKELETON_COLUMNS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TABLE_SKELETON_COLUMNS }, (_, columnIndex) => (
              <div key={`cell-${rowIndex}-${columnIndex}`} className={`${shimmerClassName} h-4 rounded`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
