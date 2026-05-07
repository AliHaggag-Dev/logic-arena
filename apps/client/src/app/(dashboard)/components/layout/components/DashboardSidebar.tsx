import React from "react";
import Image from "next/image";
import { Settings, LayoutDashboard, Trophy, Swords, Zap, User, Cpu, BookOpen, Award, ShoppingCart } from "lucide-react";
import NavLink from "../../../../../components/ui/NavLink";

const SIDEBAR_WIDTH = 220;

const navItems = [
  { href: "/dashboard", label: "DASHBOARD", iconNode: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { href: "/leaderboard", label: "LEADERBOARD", iconNode: <Trophy className="w-3.5 h-3.5" /> },
  { href: "/lobby", label: "BATTLE LOBBY", iconNode: <Swords className="w-3.5 h-3.5" /> },
  { href: "/campaign", label: "CAMPAIGN MODE", iconNode: <Zap className="w-3.5 h-3.5" /> },
  { href: "/profile", label: "MY PROFILE", iconNode: <User className="w-3.5 h-3.5" /> },
  { href: "/garage", label: "ROBOT GARAGE", iconNode: <Cpu className="w-3.5 h-3.5" /> },
  { href: "/docs", label: "ALISCRIPT DOCS", iconNode: <BookOpen className="w-3.5 h-3.5" /> },
  { href: "/tournaments", label: "TOURNAMENT HUB", iconNode: <Award className="w-3.5 h-3.5" /> },
  { href: "/black-market", label: "BLACK MARKET", iconNode: <ShoppingCart className="w-3.5 h-3.5" /> },
];

interface DashboardSidebarProps {
  username: string | null;
  avatarUrl: string | null;
  onLogout: () => void;
}

export function DashboardSidebar({ username, avatarUrl, onLogout }: DashboardSidebarProps) {
  return (
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

      {/* ── SYSTEM STATUS (Replaces Logo for more Nav room) ── */}
      <div className="p-[20px_14px_8px] relative z-10 w-full">
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.05)] text-[9px] tracking-[0.2em] font-bold uppercase overflow-hidden border ${username
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
            : "bg-yellow-500/5 border-yellow-500/20 text-yellow-500/70"
          }`}>
          <span className={`w-1.5 h-1.5 shrink-0 rounded-full animate-pulse ${username
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              : "bg-yellow-500 shadow-[0_0_8px_rgba(var(--color-yellow-500),0.6)]"
            }`} />
          <span className="truncate">{username ? "CONNECTED" : "GUEST MODE"}</span>
        </div>
      </div>

      {/* ── NAV LINKS ── */}
      <nav className="flex-1 p-[16px_10px] flex flex-col gap-1 relative z-10">
        <div className="text-[9px] tracking-[0.22em] text-accent/25 font-bold px-1 pb-2 uppercase">
          navigation
        </div>
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} iconNode={item.iconNode} />
        ))}
        <div className="mt-auto">
          <div className="mb-2 mt-2 h-px bg-accent/[0.06]" />
          <NavLink
            href="/settings"
            label="SETTINGS"
            iconNode={<Settings size={13} strokeWidth={2.5} />}
          />
        </div>
      </nav>

      {/* ── USER + LOGOUT ── */}
      <div className="p-[14px_12px] border-t border-accent/[0.08] relative z-10">
        <div className="flex items-center gap-2 mb-2.5 p-[8px_10px] bg-accent/[0.04] rounded-md border border-accent/10 hover:border-accent/30 transition-colors group cursor-default">
          <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-[10px] text-accent shrink-0 shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] transition-all duration-300 overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={24} height={24} className="w-full h-full object-cover" />
            ) : (
              "◉"
            )}
          </span>
          <div className="overflow-hidden">
            <div className="text-[9px] text-accent/35 tracking-[0.18em] mb-[2px]">PLAYER</div>
            <div className="text-[10px] text-accent/80 font-bold tracking-[0.1em] overflow-hidden text-ellipsis whitespace-nowrap">
              {username || "GUEST"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-[9px] px-[14px] bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/60 rounded-md text-red-500/50 hover:text-red-300 text-[10px] font-bold tracking-[0.2em] font-mono cursor-pointer transition-all duration-200 group"
        >
          <span className="text-[11px] transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.5)]">⏻</span>
          <span className="transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.5)]">SIGN OUT</span>
        </button>

        <div className="mt-3 text-[8px] text-accent/15 tracking-[0.15em] text-center uppercase">
          LOGIC-ARENA © 2026
        </div>
      </div>
    </aside>
  );
}
