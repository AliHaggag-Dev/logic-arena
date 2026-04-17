"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavLink from "../../components/ui/NavLink";

const SIDEBAR_WIDTH = 220;

const navItems = [
  { href: "/dashboard", label: "COMMAND_CENTER", icon: "⬡" },
  { href: "/leaderboard", label: "NEURAL_RANKINGS", icon: "◈" },
  { href: "/lobby", label: "BATTLE_LOBBY", icon: "▶" },
  { href: "/profile", label: "OPERATOR_PROFILE", icon: "◉" },
  { href: "/garage", label: "ROBOT_GARAGE", icon: "⚙" },
  { href: "/docs", label: "ALISCRIPT_DOCS", icon: "◈" },
  { href: "/tournaments", label: "TOURNAMENT_HUB", icon: "⚔" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#030712] font-mono selection:bg-[#22d3ee]/30 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside 
        className="flex flex-col bg-[#030712]/95 border-r border-[#22d3ee]/[0.12] shadow-[4px_0_30px_rgba(34,211,238,0.04)] sticky top-0 h-screen overflow-y-auto z-50 shrink-0 scrollbar-thin scrollbar-thumb-[#22d3ee]/20 scrollbar-track-transparent"
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,211,238,0.015) 3px, rgba(34,211,238,0.015) 4px)",
          }}
        />

        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent opacity-60 shrink-0" />

        {/* ── LOGO ── */}
        <div className="p-[24px_18px_20px] border-b border-[#22d3ee]/[0.08] relative z-10">
          <div className="text-[8px] tracking-[0.25em] text-[#22d3ee]/40 font-bold mb-1.5 uppercase">
            // SYS_v1.8.0
          </div>
          <h1 className="m-0 text-[17px] font-black tracking-[0.2em] text-[#22d3ee] leading-[1.2] [text-shadow:0_0_8px_rgba(34,211,238,0.8),0_0_25px_rgba(34,211,238,0.4),0_0_50px_rgba(34,211,238,0.15)]">
            LOGIC ARENA
          </h1>
          <div className="mt-2 h-[1px] bg-gradient-to-r from-[#22d3ee] to-transparent opacity-30" />
        </div>

        {/* ── NAV LINKS ── */}
        <nav className="flex-1 p-[16px_10px] flex flex-col gap-1 relative z-10">
          <div className="text-[8px] tracking-[0.22em] text-[#22d3ee]/25 font-bold px-1 pb-2 uppercase">
            navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </nav>

        {/* ── USER + LOGOUT ── */}
        <div className="p-[14px_12px] border-t border-[#22d3ee]/[0.08] relative z-10">
          {/* Username */}
          <div className="flex items-center gap-2 mb-2.5 p-[8px_10px] bg-[#22d3ee]/[0.04] rounded-md border border-[#22d3ee]/10 hover:border-[#22d3ee]/30 transition-colors group cursor-default">
            <span className="w-6 h-6 rounded-full bg-[#22d3ee]/15 border border-[#22d3ee]/40 flex items-center justify-center text-[10px] text-[#22d3ee] shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all duration-300">
              ◉
            </span>
            <div className="overflow-hidden">
              <div className="text-[8px] text-[#22d3ee]/35 tracking-[0.18em] mb-[2px]">
                OPERATOR
              </div>
              <div className="text-[10px] text-[#22d3ee]/80 font-bold tracking-[0.1em] overflow-hidden text-ellipsis whitespace-nowrap">
                {username ?? "UNKNOWN"}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-[9px] px-[14px] bg-[#ef4444]/[0.05] hover:bg-[#ef4444]/[0.15] border border-[#ef4444]/20 hover:border-[#ef4444]/60 rounded-md text-[#ef4444]/50 hover:text-[#fca5a5] text-[9px] font-bold tracking-[0.2em] font-mono cursor-pointer transition-all duration-200 hover:shadow-[0_0_14px_rgba(239,68,68,0.2)] group"
          >
            <span className="text-[11px] group-hover:[text-shadow:0_0_8px_rgba(239,68,68,0.5)]">⏻</span>
            <span className="group-hover:[text-shadow:0_0_8px_rgba(239,68,68,0.5)]">DISCONNECT</span>
          </button>

          {/* Bottom tag */}
          <div className="mt-3 text-[7px] text-[#22d3ee]/15 tracking-[0.15em] text-center uppercase">
            LOGIC-ARENA © 2026
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto bg-[#030712] relative scroll-smooth scrollbar-thin scrollbar-thumb-[#22d3ee]/10 scrollbar-track-transparent">
        {children}
      </main>
    </div>
  );
}
