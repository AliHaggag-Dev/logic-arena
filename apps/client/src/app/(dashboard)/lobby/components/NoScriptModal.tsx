import React from "react";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
}

export function NoScriptModal({ onClose }: Props) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-md bg-bg-primary border border-red-500/30 rounded-xl p-6 shadow-[0_0_40px_rgba(var(--color-red-500),0.15)] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center mb-4 pb-1 shadow-[0_0_15px_rgba(var(--color-red-500),0.2)]">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
        </div>
        <h3 className="text-[14px] font-black tracking-[0.2em] text-red-500 mb-2 uppercase drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.4)]">
          No Script Selected
        </h3>
        <p className="text-[10px] text-red-500/70 tracking-[0.14em] mb-8 leading-relaxed max-w-[85%] uppercase font-sans font-bold">
          You must choose a script before entering combat. Return to the dashboard to select yours.
        </p>

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-md text-[10px] font-bold tracking-[0.2em] font-mono transition-all duration-200 border bg-text-primary/5 text-text-secondary border-text-primary/10 hover:bg-text-primary/10 hover:text-text-primary hover:border-text-primary/30"
          >
            DISMISS
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex-[1.5] py-3 rounded-md text-[10px] font-black tracking-[0.2em] font-mono transition-all duration-200 border bg-accent/10 text-accent/70 border-accent/30 hover:bg-accent/20 hover:text-accent hover:border-accent/70 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)]"
          >
            [←] DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
