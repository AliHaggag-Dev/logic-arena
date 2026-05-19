"use client";

const STATUS_STYLES: Record<StatusIndicatorStatus, string> = {
  healthy: "bg-[var(--sem-success)] shadow-[0_0_14px_rgba(var(--sem-success-rgb),0.7)]",
  degraded: "bg-[var(--sem-warning)] shadow-[0_0_14px_rgba(var(--sem-warning-rgb),0.7)]",
  down: "bg-[var(--sem-danger)] shadow-[0_0_14px_rgba(var(--sem-danger-rgb),0.7)]",
};

export type StatusIndicatorStatus = "healthy" | "degraded" | "down";

export interface StatusIndicatorProps {
  status: StatusIndicatorStatus;
  label: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-text-secondary">
      <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${STATUS_STYLES[status]}`} />
      <span>{label}</span>
    </div>
  );
}
