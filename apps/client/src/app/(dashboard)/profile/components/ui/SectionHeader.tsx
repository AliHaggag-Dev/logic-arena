import React from "react";

interface Props {
  label: string;
  sub?: string;
}

export function SectionHeader({ label, sub }: Props) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="h-[1px] w-4 shrink-0"
        style={{ background: "var(--accent)", opacity: 0.6 }}
      />
      <h2
        className="text-[10px] font-black tracking-[0.3em] uppercase m-0 shrink-0"
        style={{ color: "var(--accent)", opacity: 0.7 }}
      >
        {label}
      </h2>
      {sub && (
        <span className="text-[8px] text-accent/30 tracking-[0.15em] font-mono shrink-0">
          {sub}
        </span>
      )}
      <div
        className="h-[1px] flex-1"
        style={{
          background:
            "linear-gradient(90deg, rgba(var(--accent-rgb),0.3), transparent)",
        }}
      />
    </div>
  );
}
