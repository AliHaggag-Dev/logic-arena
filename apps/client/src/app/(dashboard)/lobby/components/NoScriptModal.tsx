import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
}

export function NoScriptModal({ onClose }: Props) {
  const router = useRouter();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-md bg-bg-primary border border-red-500/30 rounded-xl p-6 shadow-[0_0_40px_rgba(var(--color-red-500),0.15)] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center mb-4 text-red-500 text-xl pb-1 shadow-[0_0_15px_rgba(var(--color-red-500),0.2)]">
          !
        </div>
        <h3 className="text-[14px] font-black tracking-[0.2em] text-red-500 mb-2 uppercase drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.4)]">
          No Script Selected
        </h3>
        <p className="text-[10px] text-red-500/70 tracking-[0.14em] mb-8 leading-relaxed max-w-[85%]">
          YOU MUST EQUIP A TACTICAL SCRIPT BEFORE ENTERING COMBAT. RETURN TO HEADQUARTERS TO SELECT YOUR WEAPON.
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            onMouseEnter={() => setHoveredBtn("close")}
            onMouseLeave={() => setHoveredBtn(null)}
            className={`flex-1 py-3 rounded-md text-[10px] font-bold tracking-[0.2em] font-mono transition-all duration-200 border ${hoveredBtn === "close"
                ? "bg-text-primary/10 text-text-primary border-text-primary/30"
                : "bg-text-primary/5 text-text-secondary border-text-primary/10"
              }`}
          >
            DISMISS
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            onMouseEnter={() => setHoveredBtn("dash")}
            onMouseLeave={() => setHoveredBtn(null)}
            className={`flex-[1.5] py-3 rounded-md text-[10px] font-black tracking-[0.2em] font-mono transition-all duration-200 border ${hoveredBtn === "dash"
                ? "bg-accent/20 text-accent border-accent/70 shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)]"
                : "bg-accent/10 text-accent/70 border-accent/30"
              }`}
          >
            [←] DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
