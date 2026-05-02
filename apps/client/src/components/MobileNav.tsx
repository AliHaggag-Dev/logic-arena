"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { User, Settings, Wrench, Hexagon, X, Trophy } from "lucide-react";

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
    href: "/lobby", label: "LOBBY", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <polygon points="5 3 19 12 5 21 5 3" />
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
  {
    href: "/leaderboard", label: "RANKINGS", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M22 11v1a10 10 0 1 1-9-10" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    )
  },
];

const subNavItems = [
  { href: "/profile", label: "PROFILE", icon: <User size={18} /> },
  { href: "/garage", label: "GARAGE", icon: <Wrench size={18} /> },
  { href: "/tournaments", label: "TOURNAMENTS", icon: <Trophy size={18} /> },
  { href: "/settings", label: "SETTINGS", icon: <Settings size={18} /> },
];

const arcOffsets = ["mr-2", "mr-6", "mr-12", "mr-20"];

export function MobileNav() {
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isHubOpen, setIsHubOpen] = useState(false);

  useEffect(() => {
    setIsHubOpen(false);
  }, [pathname]);

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  if (!isMobile || isAuthPage) return null;

  const isHubActive = subNavItems.some(item => pathname === item.href);

  return (
    <>
      {/* Sci-Fi Backdrop */}
      {isHubOpen && (
        <div
          className="fixed inset-0 z-30 bg-bg-primary/60 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setIsHubOpen(false)}
        />
      )}

      {/* Floating Radial Hub Menu */}
      <div className={`fixed bottom-[76px] right-2 z-40 flex flex-col-reverse items-end gap-4 pointer-events-none pb-[env(safe-area-inset-bottom)]`}>
        {subNavItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                pointer-events-auto flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isHubOpen ? `opacity-100 translate-y-0 scale-100 ${arcOffsets[index]}` : 'opacity-0 translate-y-12 scale-50 mr-2'}
              `}
              style={{ transitionDelay: `${index * 60}ms` }}
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
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full max-w-[72px] h-full transition-all duration-150 ease-out group overflow-hidden"
              >
                <div
                  className={`absolute top-0 w-10 h-[2px] rounded-b-full bg-accent transition-all duration-150 ease-out z-20 ${isActive ? "translate-y-0 opacity-100 shadow-[0_0_12px_rgba(var(--accent-rgb),1)]" : "-translate-y-full opacity-0"}`}
                />

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-[5px] pt-1.5">
                  <div
                    className={`transition-colors duration-150 ease-out flex items-center justify-center ${isActive ? "text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" : "text-text-secondary/40"}`}
                  >
                    {item.icon}
                  </div>

                  <span
                    className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors duration-150 ease-out leading-none ${isActive ? "text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.4)]" : "text-text-secondary/50"}`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* SYSTEM HUB BUTTON */}
          <button
            onClick={() => setIsHubOpen(!isHubOpen)}
            className="relative flex flex-col items-center justify-center w-full max-w-[72px] h-full transition-all duration-150 ease-out group overflow-hidden"
          >
            <div
              className={`absolute top-0 w-10 h-[2px] rounded-b-full bg-accent transition-all duration-150 ease-out z-20 ${isHubActive || isHubOpen ? "translate-y-0 opacity-100 shadow-[0_0_12px_rgba(var(--accent-rgb),1)]" : "-translate-y-full opacity-0"}`}
            />

            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-[5px] pt-1.5">
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
    </>
  );
}
