import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Settings, LayoutDashboard, Trophy, Swords, Zap, User, Cpu, BookOpen, Award, ShoppingCart, Power, LogIn, Terminal } from "lucide-react";
import NavLink from "../../../../../components/ui/NavLink";
import { useAuth } from "../../../../../context/AuthContext";

const SIDEBAR_WIDTH = 220;

const navItems = [
  { href: "/dashboard", label: "DASHBOARD", iconNode: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { href: "/leaderboard", label: "LEADERBOARD", iconNode: <Trophy className="w-3.5 h-3.5" /> },
  { href: "/lobby", label: "BATTLE LOBBY", iconNode: <Swords className="w-3.5 h-3.5" /> },
  { href: "/campaign", label: "CAMPAIGN MODE", iconNode: <Zap className="w-3.5 h-3.5" /> },
  { href: "/profile", label: "MY PROFILE", iconNode: <User className="w-3.5 h-3.5" />, exact: true },
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
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';

  return (
    <aside
      className="flex flex-col bg-bg-primary/95 border-r border-accent/[0.12] shadow-[4px_0_30px_rgba(var(--accent-rgb),0.04)] sticky top-0 h-screen overflow-hidden z-50 shrink-0"
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

      {/* ── SYSTEM TERMINAL ── */}
      <div className="px-3 pt-3 pb-1.5 relative z-10 shrink-0">
        <div
          className="relative rounded border border-accent/[0.18] overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(var(--accent-rgb),0.05) 0%, rgba(var(--accent-rgb),0.02) 50%, transparent 100%)' }}
        >
          {/* Animated scanning beam */}
          <div
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/60 to-transparent pointer-events-none"
            style={{ animation: 'uplink-scan 2.8s linear infinite' }}
          />

          {/* Corner bracket markers */}
          <span className="absolute top-[5px] left-[5px] w-[9px] h-[9px] border-t border-l border-accent/70 pointer-events-none" />
          <span className="absolute top-[5px] right-[5px] w-[9px] h-[9px] border-t border-r border-accent/70 pointer-events-none" />
          <span className="absolute bottom-[5px] left-[5px] w-[9px] h-[9px] border-b border-l border-accent/70 pointer-events-none" />
          <span className="absolute bottom-[5px] right-[5px] w-[9px] h-[9px] border-b border-r border-accent/70 pointer-events-none" />

          <div className="p-[10px_12px_8px]">
            {/* Status dot + label */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="relative flex w-[7px] h-[7px] shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${
                  username ? 'bg-emerald-400' : 'bg-yellow-400/80'
                }`} />
                <span className={`relative rounded-full w-[7px] h-[7px] ${
                  username ? 'bg-emerald-500' : 'bg-yellow-500/80'
                }`} />
              </span>
              <span className="text-[7px] font-bold tracking-[0.3em] uppercase text-accent/35 truncate">
                {username ? 'SYSTEM ONLINE' : 'NO SIGNAL'}
              </span>
            </div>

            {/* PILOT_ID + username */}
            <div className="text-[6.5px] tracking-[0.35em] text-accent/20 mb-[3px] uppercase">USERNAME://</div>
            {username ? (
              <Link
                href="/profile"
                className="text-[11px] font-black tracking-[0.1em] text-accent uppercase truncate font-mono hover:opacity-80 transition-opacity"
                style={{ textShadow: '0 0 12px rgba(var(--accent-rgb), 0.7)' }}
              >
                {username}
              </Link>
            ) : (
              <div
                className="text-[11px] font-black tracking-[0.1em] text-accent uppercase truncate font-mono"
                style={{ textShadow: '0 0 12px rgba(var(--accent-rgb), 0.7)' }}
              >
                GUEST
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NAV LINKS ── */}
      <nav className="flex-1 min-h-0 p-[12px_10px] flex flex-col gap-0.5 relative z-10">
        <div className="text-[9px] tracking-[0.22em] text-accent/25 font-bold px-1 pb-2 uppercase">
          navigation
        </div>
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <div className="mt-auto">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md font-mono text-[10px] font-bold tracking-[0.18em] transition-all duration-200 relative group overflow-hidden border border-accent/40 bg-accent/[0.07] text-accent hover:border-accent hover:bg-accent/[0.14] shadow-[0_0_14px_rgba(var(--accent-rgb),0.10),inset_0_0_14px_rgba(var(--accent-rgb),0.04)] hover:shadow-[0_0_22px_rgba(var(--accent-rgb),0.18),inset_0_0_18px_rgba(var(--accent-rgb),0.06)]"
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-80">
                <Terminal size={13} strokeWidth={2.5} />
              </span>
              <span>COMMAND CENTER</span>
            </Link>
          )}
          <div className={isAdmin ? "mb-2 mt-2 h-px bg-accent/[0.06]" : "mb-2 h-px bg-accent/[0.06]"} />
          <NavLink
            href="/settings"
            label="SETTINGS"
            iconNode={<Settings size={13} strokeWidth={2.5} />}
            exact
          />
        </div>
      </nav>

      {/* ── USER + LOGOUT ── */}
      <div className="p-[14px_12px] border-t border-accent/[0.08] relative z-10">
        {username ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 mb-2.5 p-[8px_10px] bg-accent/[0.04] rounded-md border border-accent/10 hover:border-accent/30 transition-colors group"
          >
            <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-[10px] text-accent shrink-0 shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] transition-all duration-300 overflow-hidden">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={24} height={24} className="w-full h-full object-cover" />
              ) : (
                <User size={14} />
              )}
            </span>
            <div className="overflow-hidden">
              <div className="text-[9px] text-accent/35 tracking-[0.18em] mb-[2px]">PLAYER</div>
              <div className="text-[10px] text-accent/80 font-bold tracking-[0.1em] overflow-hidden text-ellipsis whitespace-nowrap">
                {username}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 mb-2.5 p-[8px_10px] bg-accent/[0.04] rounded-md border border-accent/10 cursor-default">
            <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-[10px] text-accent shrink-0 shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)] overflow-hidden">
              <User size={14} />
            </span>
            <div className="overflow-hidden">
              <div className="text-[9px] text-accent/35 tracking-[0.18em] mb-[2px]">PLAYER</div>
              <div className="text-[10px] text-accent/80 font-bold tracking-[0.1em] overflow-hidden text-ellipsis whitespace-nowrap">
                GUEST
              </div>
            </div>
          </div>
        )}

        {username ? (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-[9px] px-[14px] bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/60 rounded-md text-red-500/50 hover:text-red-300 text-[10px] font-bold tracking-[0.2em] font-mono cursor-pointer transition-all duration-200 group"
          >
            <Power size={11} className="transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.5)]" />
            <span className="transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.5)]">SIGN OUT</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-1.5 py-[9px] px-[14px] bg-accent/5 hover:bg-accent/15 border border-accent/20 hover:border-accent/60 rounded-md text-accent/50 hover:text-accent text-[10px] font-bold tracking-[0.2em] font-mono transition-all duration-200 group"
          >
            <LogIn size={11} className="transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
            <span className="transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]">LOG IN</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
