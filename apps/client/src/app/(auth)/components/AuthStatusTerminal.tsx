import React from "react";

interface Props {
  status: {
    message: string;
    errors: string[];
    type: "error" | "success" | null;
  };
}

export function AuthStatusTerminal({ status }: Props) {
  return (
    <div className="min-h-[48px] flex items-start justify-center">
      {status.message && (
        <div className={`w-full p-3.5 rounded-lg border text-[10px] tracking-[0.1em] text-center font-bold break-words transition-all ${status.type === "success"
          ? "bg-accent/10 border-accent/40 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
          : "bg-accent/10 border-accent/40 text-accent animate-pulse"
          }`}>
          {status.message}
        </div>
      )}

      {status.errors.length > 0 && (
        <div className="w-full p-3.5 rounded-lg border bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(var(--color-red-500),0.15)] space-y-1">
          {status.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] tracking-[0.08em] font-black text-red-500 uppercase break-words">
              <span className="shrink-0 opacity-50">›</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
