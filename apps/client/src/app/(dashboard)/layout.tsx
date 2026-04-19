"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavLink from "../../components/ui/NavLink";
import { ThemeSwitcher } from "../../components/ui/ThemeSwitcher";
import { useGlobalSocket } from "../../hooks/useGlobalSocket";
import { SocketContext } from "../../context/SocketContext";

const SIDEBAR_WIDTH = 220;

const navItems = [
  { href: "/dashboard", label: "COMMAND_CENTER", icon: "⬡" },
  { href: "/leaderboard", label: "NEURAL_RANKINGS", icon: "◈" },
  { href: "/lobby", label: "BATTLE_LOBBY", icon: "▶" },
  { href: "/campaign", label: "CAMPAIGN_MODE", icon: "⚡" },
  { href: "/profile", label: "OPERATOR_PROFILE", icon: "◉" },
  { href: "/garage", label: "ROBOT_GARAGE", icon: "⚙" },
  { href: "/docs", label: "ALISCRIPT_DOCS", icon: "◈" },
  { href: "/tournaments", label: "TOURNAMENT_HUB", icon: "⚔" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [incomingChallenge, setIncoming] = useState<{ challengerId: string; challengerName: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "info" | "error" } | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  const showToast = useCallback((message: string, type: "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const { sendChallenge, acceptChallenge } = useGlobalSocket({
    onChallengeReceived: (data) => setIncoming(data),
    onChallengeSent: () => showToast("⚔ CHALLENGE SENT — AWAITING RESPONSE"),
    onChallengeFailed: () => showToast("TARGET IS OFFLINE", "error"),
    onChallengeAccepted: () => showToast("CHALLENGE ACCEPTED — DEPLOYING TO ARENA"),
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <SocketContext.Provider value={{ sendChallenge }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex min-h-screen bg-bg-primary font-mono selection:bg-accent/30 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside
          className="flex flex-col bg-bg-primary/95 border-r border-accent/[0.12] shadow-[4px_0_30px_rgba(var(--accent-rgb),0.04)] sticky top-0 h-screen overflow-y-auto z-50 shrink-0 scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--accent-rgb),0.015) 3px, rgba(var(--accent-rgb),0.015) 4px)",
            }}
          />

          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-60 shrink-0" />

          {/* ── LOGO ── */}
          <div className="p-[24px_18px_20px] border-b border-accent/[0.08] relative z-10">
            <div className="text-[9px] tracking-[0.25em] text-accent/40 font-bold mb-1.5 uppercase">
              // SYS_v1.8.0
            </div>
            <h1 className="m-0 text-[17px] font-black tracking-[0.2em] text-accent leading-[1.2] [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.8),0_0_25px_rgba(var(--accent-rgb),0.4),0_0_50px_rgba(var(--accent-rgb),0.15)]">
              LOGIC ARENA
            </h1>
            <div className="mt-2 h-[1px] bg-gradient-to-r from-accent to-transparent opacity-30" />
          </div>

          {/* ── NAV LINKS ── */}
          <nav className="flex-1 p-[16px_10px] flex flex-col gap-1 relative z-10">
            <div className="text-[9px] tracking-[0.22em] text-accent/25 font-bold px-1 pb-2 uppercase">
              navigation
            </div>
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </nav>

          {/* ── THEME SWITCHER ── */}
          <ThemeSwitcher />

          {/* ── USER + LOGOUT ── */}
          <div className="p-[14px_12px] border-t border-accent/[0.08] relative z-10">
            <div className="flex items-center gap-2 mb-2.5 p-[8px_10px] bg-accent/[0.04] rounded-md border border-accent/10 hover:border-accent/30 transition-colors group cursor-default">
              <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-[10px] text-accent shrink-0 shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] transition-all duration-300">
                ◉
              </span>
              <div className="overflow-hidden">
                <div className="text-[9px] text-accent/35 tracking-[0.18em] mb-[2px]">OPERATOR</div>
                <div className="text-[10px] text-accent/80 font-bold tracking-[0.1em] overflow-hidden text-ellipsis whitespace-nowrap">
                  {username ?? "UNKNOWN"}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-[9px] px-[14px] bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/60 rounded-md text-red-500/50 hover:text-red-300 text-[10px] font-bold tracking-[0.2em] font-mono cursor-pointer transition-all duration-200 group"
            >
              <span className="text-[11px] transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.5)]">⏻</span>
              <span className="transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.5)]">DISCONNECT</span>
            </button>

            <div className="mt-3 text-[8px] text-accent/15 tracking-[0.15em] text-center uppercase">
              LOGIC-ARENA © 2026
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-auto bg-bg-primary relative scroll-smooth scrollbar-thin scrollbar-thumb-accent/10 scrollbar-track-transparent">
          {children}
        </main>

        {/* ── TOAST ── */}
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 z-[100] font-mono text-[11px] tracking-[0.15em] px-5 py-3 rounded-lg border pointer-events-none"
            style={{
              transform: "translateX(-50%)",
              animation: "fadeInUp 0.25s ease",
              background:
                toast.type === "info"
                  ? "rgba(var(--accent-rgb),0.08)"
                  : "rgba(var(--color-red-500),0.10)",
              border: `1px solid ${toast.type === "info"
                ? "rgba(var(--accent-rgb),0.35)"
                : "rgba(var(--color-red-500),0.35)"
                }`,
              color: toast.type === "info" ? "var(--accent)" : "#fca5a5",
            }}
          >
            {toast.message}
          </div>
        )}

        {/* ── CHALLENGE MODAL ── */}
        {incomingChallenge && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-card/60 backdrop-blur-sm">
            <div
              className="border border-accent/30 bg-bg-primary rounded-xl p-8 max-w-sm w-full mx-4 font-mono"
              style={{
                boxShadow: "0 0 40px rgba(var(--accent-rgb),0.15)",
                animation: "modalIn 0.2s ease",
              }}
            >
              <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-2">
                // INCOMING_TRANSMISSION
              </p>
              <h2 className="text-accent font-black tracking-[0.18em] text-xl mb-2">
                COMBAT REQUEST
              </h2>
              <p className="text-accent/60 text-[11px] tracking-[0.12em] mb-6">
                <span className="text-accent">{incomingChallenge.challengerName}</span>
                {" "}challenges you to combat.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    acceptChallenge(incomingChallenge.challengerId);
                    setIncoming(null);
                  }}
                  className="flex-1 py-2 text-[11px] tracking-[0.18em] font-bold border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-all"
                >
                  ACCEPT
                </button>
                <button
                  onClick={() => setIncoming(null)}
                  className="flex-1 py-2 text-[11px] tracking-[0.18em] font-bold border border-red-500/30 bg-red-500/5 text-red-500/70 hover:bg-red-500/15 rounded-lg transition-all"
                >
                  DECLINE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SocketContext.Provider>
  );
}
