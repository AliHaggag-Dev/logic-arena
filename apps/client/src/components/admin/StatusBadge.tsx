"use client";

const STATUS_COLOR_MAP: Record<string, string> = {
  CRITICAL: "border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.14)] text-[var(--sem-danger)]",
  HIGH: "border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.14)] text-[var(--sem-danger)]",
  MEDIUM: "border-[var(--sem-warning)] bg-[rgba(var(--sem-warning-rgb),0.14)] text-[var(--sem-warning)]",
  LOW: "border-[var(--sem-success)] bg-[rgba(var(--sem-success-rgb),0.14)] text-[var(--sem-success)]",
  NICE_TO_HAVE: "border-[var(--sem-success)] bg-[rgba(var(--sem-success-rgb),0.14)] text-[var(--sem-success)]",
  OPEN: "border-[var(--sem-warning)] bg-[rgba(var(--sem-warning-rgb),0.14)] text-[var(--sem-warning)]",
  RESOLVED: "border-[var(--sem-success)] bg-[rgba(var(--sem-success-rgb),0.14)] text-[var(--sem-success)]",
  CLOSED: "border-[var(--sem-success)] bg-[rgba(var(--sem-success-rgb),0.14)] text-[var(--sem-success)]",
  PENDING: "border-[var(--sem-info)] bg-[rgba(var(--sem-info-rgb),0.14)] text-[var(--sem-info)]",
  IN_PROGRESS: "border-accent bg-accent/10 text-accent",
};

export type StatusBadgeType = "severity" | "priority" | "feedback" | "general";

export interface StatusBadgeProps {
  status: string;
  type?: StatusBadgeType;
}

function normalizeStatus(status: string): string {
  return status.trim().replace(/\s+/g, "_").toUpperCase();
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const normalizedStatus = normalizeStatus(status);
  const colorClassName = STATUS_COLOR_MAP[normalizedStatus] ?? "border-accent/40 bg-accent/10 text-accent";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest shadow-[0_0_14px_rgba(var(--accent-rgb),0.08)] ${colorClassName}`}>
      {status}
    </span>
  );
}
