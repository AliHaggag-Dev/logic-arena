import Link from "next/link";
import { Loader2, Lock, Zap } from "lucide-react";

interface MarketHeaderProps {
  isGuest: boolean;
  loading: boolean;
  points: number;
}

export function MarketHeader({ isGuest, loading, points }: MarketHeaderProps) {
  const pointsWidget = (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md"
      style={{
        background: isGuest
          ? "rgba(var(--accent-rgb),0.02)"
          : "rgba(var(--accent-rgb),0.05)",
        borderColor: isGuest
          ? "rgba(var(--accent-rgb),0.12)"
          : "rgba(var(--accent-rgb),0.25)",
        boxShadow: isGuest
          ? "none"
          : "0 0 24px rgba(var(--accent-rgb),0.08)",
      }}
    >
      {isGuest ? (
        <Lock
          className="w-5 h-5 flex-shrink-0"
          style={{ color: "rgba(var(--accent-rgb),0.35)" }}
        />
      ) : (
        <Zap
          className="w-5 h-5 text-accent flex-shrink-0"
          style={{ filter: "drop-shadow(0 0 6px rgba(var(--accent-rgb),0.8))" }}
        />
      )}
      <div>
        <div className="text-[8px] tracking-[0.3em] uppercase"
          style={{ color: isGuest ? "rgba(var(--accent-rgb),0.25)" : "rgba(var(--accent-rgb),0.4)" }}>
          AVAILABLE POINTS
        </div>
        {loading ? (
          <div className="flex items-center gap-2 mt-0.5">
            <Loader2 className="w-4 h-4 text-accent/40 animate-spin" />
            <span className="text-[12px] text-accent/30 font-black">LOADING…</span>
          </div>
        ) : isGuest ? (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div
              className="text-[22px] font-black tracking-[0.1em] leading-none"
              style={{ color: "rgba(var(--accent-rgb),0.3)" }}
            >
              0
            </div>
            <span
              className="text-[7px] tracking-[0.18em] uppercase font-bold"
              style={{ color: "rgba(var(--accent-rgb),0.25)" }}
            >
              Log in to earn points
            </span>
          </div>
        ) : (
          <div
            className="text-[22px] font-black tracking-[0.1em] text-accent leading-none"
            style={{ textShadow: "0 0 16px rgba(var(--accent-rgb),0.9)" }}
          >
            {points.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="border-b border-accent/10 pb-8 mb-10">

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1
            className="text-[clamp(30px,5vw,56px)] font-black tracking-[0.25em] text-accent leading-none uppercase"
            style={{ animation: "headerGlow 3s ease-in-out infinite" }}
          >
            THE BLACK
            <span className="block text-[0.55em] tracking-[0.4em] text-accent/60 mt-1">_MARKET</span>
          </h1>
          <p className="mt-3 text-[10px] text-accent/35 tracking-[0.18em] uppercase font-bold">
            SPEND YOUR SPOILS — UPGRADE YOUR ARSENAL
          </p>
        </div>

        {isGuest ? (
          <Link href="/login" title="Log in to earn points" aria-label="Log in to earn points">
            {pointsWidget}
          </Link>
        ) : (
          pointsWidget
        )}
      </div>
    </div>
  );
}
