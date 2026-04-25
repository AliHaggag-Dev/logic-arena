"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMediaQuery } from "../hooks/useMediaQuery";

const navItems = [
  { href: "/dashboard", label: "COMMAND", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <rect width="7" height="9" x="3" y="3" rx="1.5" />
        <rect width="7" height="5" x="14" y="3" rx="1.5" />
        <rect width="7" height="9" x="14" y="12" rx="1.5" />
        <rect width="7" height="5" x="3" y="16" rx="1.5" />
      </svg>
  ) },
  { href: "/lobby", label: "LOBBY", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
  ) },
  { href: "/campaign", label: "CAMPAIGN", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
  ) },
  { href: "/leaderboard", label: "RANKINGS", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M22 11v1a10 10 0 1 1-9-10" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
  ) },
  { href: "/profile", label: "PROFILE", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
  ) },
];

export function MobileNav() {
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery("(max-width: 768px)");

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  // Hide on desktop AND hide on mobile auth pages
  if (!isMobile || isAuthPage) return null;

  return (
    <div 
      className="mobile-nav-safe fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-bg-primary/80 backdrop-blur-xl border-t border-accent/[0.12] shadow-[0_-10px_30px_rgba(var(--accent-rgb),0.05),inset_0_2px_10px_rgba(var(--accent-rgb),0.05)] w-full transition-all duration-150"
    >
      <nav className="flex items-center justify-around w-full h-[64px] px-1 mb-[6px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full max-w-[72px] h-full transition-all duration-150 ease-out group overflow-hidden"
            >
              {/* Top Active Line */}
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
      </nav>
    </div>
  );
}
