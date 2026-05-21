import React from "react";
import { CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

interface Props {
  status: {
    message?: string;
    errors?: string[];
    type: "error" | "success" | "info" | "loading" | null;
  };
}

export function AuthStatusMessage({ status }: Props) {
  const hasErrors = (status.errors?.length ?? 0) > 0;
  const hasMessage = !!status.message;

  if (!hasErrors && !hasMessage) return <div className="h-2" />;

  const colorMap = {
    error: {
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.25)',
      text: 'rgb(252,165,165)',
      icon: <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: 'rgb(252,165,165)' }} />,
    },
    success: {
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.2)',
      text: 'rgb(134,239,172)',
      icon: <CheckCircle size={15} className="shrink-0 mt-0.5" style={{ color: 'rgb(134,239,172)' }} />,
    },
    info: {
      bg: 'rgba(var(--accent-rgb),0.08)',
      border: 'rgba(var(--accent-rgb),0.2)',
      text: 'var(--accent)',
      icon: <Info size={15} className="shrink-0 mt-0.5 text-accent" />,
    },
    loading: {
      bg: 'rgba(var(--accent-rgb),0.06)',
      border: 'rgba(var(--accent-rgb),0.15)',
      text: 'var(--accent)',
      icon: <Loader2 size={15} className="shrink-0 mt-0.5 text-accent animate-spin" />,
    },
  };

  const type = status.type ?? (hasErrors ? "error" : "info");
  const colors = colorMap[type] ?? colorMap.info;

  return (
    <div
      className="w-full rounded-xl px-4 py-3 mb-1 flex items-start gap-3"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      role="alert"
      aria-live="polite"
    >
      {colors.icon}
      <div className="text-sm leading-relaxed" style={{ color: colors.text }}>
        {hasErrors
          ? status.errors!.map((err, i) => <div key={i}>{err}</div>)
          : status.message}
      </div>
    </div>
  );
}
