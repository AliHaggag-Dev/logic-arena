"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "./ui/ThemeSwitcher";
import { useAuthState } from "../hooks/useAuthState";
import { clearAuthSession, clearSensitiveBrowserStorage } from "../lib/client-security";
import { LogIn, LogOut, LayoutDashboard, UserPlus, Lightbulb } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationBell } from "../app/(dashboard)/components/layout/components/NotificationBell";

export function MobileHeader() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { isGuest: isNotLoggedIn, refresh } = useAuthState();
  const isLoggedIn = !isNotLoggedIn;
  const notifications = useNotifications();

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  const staticRoutes = [
    "/how-it-works", "/aliscript-docs", "/robot-builder", "/tournaments", "/practice",
    "/patch-notes", "/linkedin", "/github", "/portfolio", "/terms", "/privacy", "/cookie", "/contact",
    "/bug-report", "/feature-requests"
  ];

  const isArenaPage = pathname === "/arena" || pathname.startsWith("/arena/");
  if (isArenaPage || pathname.startsWith("/replay")) {
    return null;
  }

  const isStaticPage = staticRoutes.some(route => pathname.startsWith(route)) || pathname === "/";

  const visibilityClass = (isAuthPage || isStaticPage) ? "flex" : "flex md:hidden";



  const getIconButton = (icon: React.ReactNode, onClick: () => void, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group cursor-pointer"
      style={{
        background: 'rgba(var(--accent-rgb),0.08)',
        border: '1px solid rgba(var(--accent-rgb),0.15)',
      }}
      onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(var(--accent-rgb),0.15)'; }}
      onMouseLeave={(e) => { (e.currentTarget).style.background = 'rgba(var(--accent-rgb),0.08)'; }}
    >
      <div className="text-accent group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
    </button>
  );

  let authButtonContent = null;
  if (!isLoggedIn) {
    if (pathname === "/login") {
      authButtonContent = getIconButton(<UserPlus size={20} />, () => router.push("/register"), "Register");
    } else {
      authButtonContent = getIconButton(<LogIn size={20} />, () => router.push("/login"), "Login");
    }
  }

  const insightsButton = getIconButton(<Lightbulb size={20} />, () => router.push("/insights"), "Insights");

  return (
    <header className={`mobile-header-safe w-full ${visibilityClass} items-center justify-between px-4 border-b border-accent/8 bg-bg-primary z-[60] fixed top-0 left-0 right-0 min-h-14`}>
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="p-0 bg-transparent border-0 cursor-pointer hover:opacity-90 transition-opacity"
        aria-label="Logic Arena — Go to dashboard"
      >
        <Image
          src="/dashboard-logo.png"
          alt="Logic Arena"
          width={140}
          height={40}
          className="app-logo-img block"
          style={{ height: "40px", width: "auto" }}
          unoptimized
          priority
        />
      </button>
      <div className="flex items-center gap-3">
        {insightsButton}
        {isLoggedIn && <NotificationBell notifications={notifications} isMobile />}
        {authButtonContent}
      </div>
    </header>
  );
}

