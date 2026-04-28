import React from "react";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "../../../../../components/ui/ThemeSwitcher";

interface DashboardHeaderProps {
  username: string | null;
}

export function DashboardHeader({ username }: DashboardHeaderProps) {
  const router = useRouter();
  
  return (
    <header className="sticky top-0 z-40 w-full bg-bg-primary/90 backdrop-blur-xl border-b border-accent/[0.08] p-[16px_28px] flex items-center justify-between shrink-0 shadow-[0_10px_40px_rgba(var(--accent-rgb),0.05)]">
      <div>
        <div className="text-[9px] tracking-[0.25em] text-accent/60 font-bold mb-1.5 uppercase">
          // SYS_v2.2.0
        </div>
        <h1 
          onClick={() => router.push("/dashboard")}
          className="m-0 text-[18px] font-black tracking-[0.25em] text-accent leading-none [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.8),0_0_15px_rgba(var(--accent-rgb),0.3)] cursor-pointer hover:opacity-90 transition-opacity"
        >
          LOGIC ARENA
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-accent/20 bg-accent/5 rounded-md text-[9px] tracking-[0.2em] font-bold text-accent/60 shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.05)] uppercase max-w-[200px]">
          <span className="shrink-0 text-accent/40">USER:</span>
          <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.6)] truncate">
            {username || "GUEST"}
          </span>
        </div>
        <ThemeSwitcher variant="minimal" />
      </div>
    </header>
  );
}
