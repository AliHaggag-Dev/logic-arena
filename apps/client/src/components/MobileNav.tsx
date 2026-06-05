"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Settings, Wrench, Hexagon, X, Trophy, FileCode, Shield, ShoppingCart, Compass } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const mainNavItems = [
  {
    href: "/dashboard", label: "COMMAND", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <rect width="7" height="9" x="3" y="3" rx="1.5" />
        <rect width="7" height="5" x="14" y="3" rx="1.5" />
        <rect width="7" height="9" x="14" y="12" rx="1.5" />
        <rect width="7" height="5" x="3" y="16" rx="1.5" />
      </svg>
    )
  },
  {
    href: "/leaderboard", label: "RANKINGS", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M22 11v1a10 10 0 1 1-9-10" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    )
  },
  {
    href: "/campaign", label: "CAMPAIGN", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    )
  },
];

const subNavItems = [
  { href: "/profile", label: "PROFILE", icon: <User size={18} /> },
  { href: "/garage", label: "GARAGE", icon: <Wrench size={18} /> },
  { href: "/docs", label: "ALISCRIPT", icon: <FileCode size={18} /> },
  { href: "/black-market", label: "BLACK MARKET", icon: <ShoppingCart size={18} /> },
  { href: "/settings", label: "SETTINGS", icon: <Settings size={18} /> },
];

const arcOffsets = ["mr-2", "mr-6", "mr-12", "mr-20", "mr-28"];

export function MobileNav() {
  const pathname = usePathname() || "";
  const [isHubOpen, setIsHubOpen] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    setIsHubOpen(false);
  }, [pathname]);

  const hiddenRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/arena", "/replay"];
  const isHiddenPage = hiddenRoutes.some(route => {
    if (route === "/arena") {
      return pathname === "/arena" || pathname.startsWith("/arena/");
    }
    return pathname.startsWith(route);
  });

  if (isHiddenPage) return null;

  const visibleMainNavItems = isAdmin
    ? [
        ...mainNavItems,
        {
          href: "/admin",
          label: "ADMIN",
          icon: <Shield size={22} strokeWidth={1.8} />,
        },
      ]
    : [
        ...mainNavItems,
        {
          href: "/tournaments",
          label: "TOURNAMENTS",
          icon: <Trophy size={22} strokeWidth={1.8} />,
        },
      ];
  const isHubActive = subNavItems.some(item => pathname === item.href) || pathname === "/arena-guide";

  return (
    <div className="md:hidden block">
      {/* Sci-Fi Backdrop (GPU optimized opacity transition, no heavy backdrop-blur) */}
      <div
        className={`fixed inset-0 z-30 bg-bg-primary/60 transition-opacity duration-300 ${
          isHubOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsHubOpen(false)}
      />

      {/* Floating Radial Hub Menu */}
      <div className={`fixed bottom-[76px] right-2 z-40 flex flex-col-reverse items-end gap-4 pointer-events-none pb-[env(safe-area-inset-bottom)]`}>
        {subNavItems.map((item, index) => {
          const isActive = pathname === item.href;

          if (item.href === "/docs") {
            return (
              <div
                key={item.href}
                className={`
                  flex items-center gap-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isHubOpen ? 'pointer-events-auto opacity-100 translate-y-0 scale-100 mr-4' : 'pointer-events-none opacity-0 translate-y-12 scale-50 mr-2'}
                `}
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                {/* ARENA GUIDE */}
                <Link
                  href="/arena-guide"
                  className="flex items-center gap-3"
                  onClick={() => setIsHubOpen(false)}
                >
                  <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border backdrop-blur-xl transition-all duration-300 ${pathname === "/arena-guide" ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-bg-secondary/80 border-accent/20 text-text-primary'}`}>
                    ARENA GUIDE
                  </span>
                  <div className={`
                    flex items-center justify-center w-[46px] h-[46px] rounded-full border backdrop-blur-xl transition-all duration-300
                    ${pathname === "/arena-guide" ? 'bg-accent/10 border-accent text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]' : 'bg-bg-secondary/80 border-accent/20 text-text-secondary/70'}
                  `}>
                    <Compass size={18} />
                  </div>
                </Link>

                {/* ALISCRIPT */}
                <Link
                  href="/docs"
                  className="flex items-center gap-3"
                  onClick={() => setIsHubOpen(false)}
                >
                  <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border backdrop-blur-xl transition-all duration-300 ${isActive ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-bg-secondary/80 border-accent/20 text-text-primary'}`}>
                    ALISCRIPT
                  </span>
                  <div className={`
                    flex items-center justify-center w-[46px] h-[46px] rounded-full border backdrop-blur-xl transition-all duration-300
                    ${isActive ? 'bg-accent/10 border-accent text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]' : 'bg-bg-secondary/80 border-accent/20 text-text-secondary/70'}
                  `}>
                    {item.icon}
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isHubOpen ? `pointer-events-auto opacity-100 translate-y-0 scale-100 ${arcOffsets[index]}` : 'pointer-events-none opacity-0 translate-y-12 scale-50 mr-2'}
              `}
              style={{ transitionDelay: `${index * 40}ms` }}
              onClick={() => setIsHubOpen(false)}
            >
              <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border backdrop-blur-xl transition-all duration-300 ${isActive ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-bg-secondary/80 border-accent/20 text-text-primary'}`}>
                {item.label}
              </span>
              <div className={`
                flex items-center justify-center w-[46px] h-[46px] rounded-full border backdrop-blur-xl transition-all duration-300
                ${isActive ? 'bg-accent/10 border-accent text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]' : 'bg-bg-secondary/80 border-accent/20 text-text-secondary/70'}
              `}>
                {item.icon}
              </div>
            </Link>
          );
        })}
      </div>

      <div
        className="mobile-nav-safe fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-bg-primary/85 backdrop-blur-xl border-t border-accent/[0.12] shadow-[0_-10px_30px_rgba(var(--accent-rgb),0.05),inset_0_2px_10px_rgba(var(--accent-rgb),0.05)] w-full transition-all duration-150"
      >
        <nav className="flex items-center justify-around w-full h-[64px] px-1 mb-[6px]">
          {visibleMainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex min-h-11 flex-col items-center justify-center w-full max-w-[72px] h-full transition-all duration-150 ease-out group overflow-hidden"
              >
                <div
                  className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-accent transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20 ${isActive ? "translate-y-0 opacity-100 shadow-[0_0_10px_rgba(var(--accent-rgb),1)] scale-100" : "translate-y-2 opacity-0 scale-50"}`}
                />

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-1 pt-1 pb-2">
                  <div
                    className={`transition-colors duration-150 ease-out flex items-center justify-center ${isActive ? "text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" : "text-text-secondary/40"}`}
                  >
                    {item.icon}
                  </div>

                  <span
                    className={`max-[380px]:sr-only max-w-[58px] text-center text-[7.5px] font-bold tracking-wider uppercase transition-colors duration-150 ease-out leading-[0.95] ${isActive ? "text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.4)]" : "text-text-secondary/50"}`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* SYSTEM HUB BUTTON */}
          <button
            type="button"
            onClick={() => setIsHubOpen(!isHubOpen)}
            className="relative flex min-h-11 flex-col items-center justify-center w-full max-w-[72px] h-full transition-all duration-150 ease-out group overflow-hidden"
          >
            <div
              className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-accent transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20 ${isHubActive || isHubOpen ? "translate-y-0 opacity-100 shadow-[0_0_10px_rgba(var(--accent-rgb),1)] scale-100" : "translate-y-2 opacity-0 scale-50"}`}
            />

            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-1 pt-1 pb-2">
              <div
                className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${isHubOpen ? "text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)] rotate-90 scale-110" : isHubActive ? "text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" : "text-text-secondary/40"}`}
              >
                {isHubOpen ? <X size={22} strokeWidth={2} /> : <Hexagon size={22} strokeWidth={1.5} />}
              </div>

              <span
                className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors duration-150 ease-out leading-none ${isHubActive || isHubOpen ? "text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.4)]" : "text-text-secondary/50"}`}
              >
                SYSTEM
              </span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
}
