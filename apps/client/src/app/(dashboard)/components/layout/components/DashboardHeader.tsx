import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "../../../../../components/ui/ThemeSwitcher";

interface DashboardHeaderProps {
  username: string | null;
  avatarUrl: string | null;
}

export function DashboardHeader({ username, avatarUrl }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full bg-bg-primary/90 backdrop-blur-xl border-b border-accent/[0.08] p-[16px_28px] flex items-center justify-between shrink-0 shadow-[0_10px_40px_rgba(var(--accent-rgb),0.05)]">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="p-0 bg-transparent border-0 cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-3"
        aria-label="Logic Arena — Go to dashboard"
      >
        <Image
          src="/dashboard-logo.png"
          alt="Logic Arena"
          width={180}
          height={48}
          className="app-logo-img block"
          style={{ height: "44px", width: "auto" }}
          unoptimized
          priority
        />
        <div className="flex flex-col leading-none gap-[3px]">
          <span className="text-[17px] font-black tracking-[0.22em] text-accent [text-shadow:0_0_10px_rgba(var(--accent-rgb),0.7)] uppercase">
            LOGIC
          </span>
          <span className="text-[17px] font-black tracking-[0.22em] text-accent [text-shadow:0_0_10px_rgba(var(--accent-rgb),0.7)] uppercase">
            ARENA
          </span>
        </div>
      </button>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-accent/20 bg-accent/5 rounded-md text-[9px] tracking-[0.2em] font-bold text-accent/60 shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.05)] uppercase max-w-[200px]">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={20} height={20} className="w-5 h-5 rounded-full object-cover shrink-0 border border-accent/30" />
          ) : (
            <span className="shrink-0 text-accent/40">USER:</span>
          )}
          <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.6)] truncate">
            {username || "GUEST"}
          </span>
        </div>
        <ThemeSwitcher variant="minimal" />
      </div>
    </header>
  );
}
