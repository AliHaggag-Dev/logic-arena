import type { ReactNode } from "react";

export interface PublicSectionCardProps {
  id: string;
  index: number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function PublicSectionCard({ id, index, title, icon, children }: PublicSectionCardProps) {
  return (
    <section
      id={id}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 bg-bg-secondary/50"
      style={{
        border: "1px solid rgba(var(--accent-rgb), 0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        scrollMarginTop: "6rem",
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top left, rgba(var(--accent-rgb), 0.04) 0%, transparent 60%)" }}
      />

      {/* Left accent line */}
      <div
        className="absolute left-0 top-4 bottom-4 w-px transition-all duration-300"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), 0.3), transparent)",
        }}
      />

      {/* Section header */}
      <div
        className="flex items-center gap-4 px-6 sm:px-8 py-5 border-b"
        style={{ borderColor: "rgba(var(--accent-rgb), 0.1)" }}
      >
        {/* Index number */}
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black tracking-wider"
          style={{
            background: "rgba(var(--accent-rgb), 0.08)",
            border: "1px solid rgba(var(--accent-rgb), 0.2)",
            color: "rgba(var(--accent-rgb), 0.6)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {String(index).padStart(2, "0")}
        </div>

        {/* Icon */}
        <div style={{ color: "var(--accent)" }}>
          {icon}
        </div>

        {/* Title */}
        <h2
          className="text-[12px] sm:text-[13px] font-black tracking-[0.2em] uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
        >
          {title}
        </h2>
      </div>

      {/* Content area */}
      <div className="px-6 sm:px-8 py-6">
        {children}
      </div>
    </section>
  );
}

/* ─── Body text helper ───────────────────────────────────── */

export function PublicBody({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[13px] sm:text-[14px] leading-[1.9] tracking-[0.02em]"
      style={{ color: "rgba(var(--accent-rgb), 0.7)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </p>
  );
}

/* ─── Definition block (for legal terms) ────────────────── */

export function PublicDefinition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-3 sm:gap-8 px-5 sm:px-8 py-5 border-b last:border-0 hover:bg-accent/5 transition-colors duration-300"
      style={{ borderColor: "rgba(var(--accent-rgb), 0.1)" }}
    >
      <div className="shrink-0 sm:w-48 mt-0.5 flex items-start gap-3">
        <div className="mt-[6px] w-1 h-1 rounded-sm bg-accent/60" />
        <span
          className="text-[11px] font-black tracking-[0.25em] uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
          }}
        >
          {term}
        </span>
      </div>
      <p
        className="text-[13px] leading-[1.8] flex-1"
        style={{ color: "rgba(var(--accent-rgb), 0.7)", fontFamily: "var(--font-mono)" }}
      >
        {children}
      </p>
    </div>
  );
}

/* ─── Footer CTA banner ──────────────────────────────────── */

export function PublicFooterCTA({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl px-6 sm:px-8 py-6 text-center"
      style={{
        background: "rgba(var(--accent-rgb), 0.04)",
        border: "1px solid rgba(var(--accent-rgb), 0.12)",
      }}
    >
      <p
        className="text-[11px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "rgba(var(--accent-rgb), 0.55)", fontFamily: "var(--font-mono)" }}
      >
        {children}
      </p>
    </div>
  );
}
