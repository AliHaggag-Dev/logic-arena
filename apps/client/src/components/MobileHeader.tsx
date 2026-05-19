"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "./ui/ThemeSwitcher";
import { useAuthState } from "../hooks/useAuthState";
import { clearAuthSession, clearSensitiveBrowserStorage } from "../lib/client-security";

export function MobileHeader() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { isGuest: isNotLoggedIn, refresh } = useAuthState();
  const isLoggedIn = !isNotLoggedIn;

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  const staticRoutes = [
    "/how-it-works", "/aliscript-docs", "/robot-builder", "/tournaments", "/practice",
    "/patch-notes", "/linkedin", "/github", "/portfolio", "/terms", "/privacy", "/cookie", "/contact",
    "/bug-report", "/feature-requests"
  ];
  const isStaticPage = staticRoutes.some(route => pathname.startsWith(route)) || pathname === "/";

  const visibilityClass = (isAuthPage || isStaticPage) ? "flex" : "flex md:hidden";

  const handleLogout = async () => {
    try {
      await import('../lib/api-client').then(m => m.apiClient.post("/auth/logout"));
    } catch (e) { }
    clearSensitiveBrowserStorage();
    clearAuthSession();
    refresh();
    router.push("/login");
  };

  let authButtonContent = null;

  if (isLoggedIn) {
    if (isAuthPage) {
      authButtonContent = (
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-accent/50 hover:text-accent transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
        >
          [ DASHBOARD ]
        </button>
      );
    } else {
      authButtonContent = (
        <button
          type="button"
          onClick={handleLogout}
          className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-red-500/50 hover:text-red-500 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.6)]"
        >
          [ LOGOUT ]
        </button>
      );
    }
  } else {
    if (pathname === "/login") {
      authButtonContent = (
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-accent/50 hover:text-accent transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
        >
          [ REGISTER ]
        </button>
      );
    } else if (pathname === "/register" || (isAuthPage && pathname !== "/login")) {
      authButtonContent = (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-accent/50 hover:text-accent transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
        >
          [ LOGIN ]
        </button>
      );
    } else {
      // Masterclass UX: Split pill button for non-auth browsing pages
      authButtonContent = (
        <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 px-2.5 py-1.5 rounded-lg shadow-[inset_0_0_8px_rgba(var(--accent-rgb),0.05)]">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-[8.5px] font-black tracking-[0.2em] uppercase text-accent/50 hover:text-accent transition-all duration-300"
          >
            LOGIN
          </button>
          <span className="text-[9px] text-accent/30 font-light drop-shadow-[0_0_2px_rgba(var(--accent-rgb),0.3)]">/</span>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-[8.5px] font-black tracking-[0.2em] uppercase text-accent hover:text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.5)] hover:drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.8)] transition-all duration-300"
          >
            REGISTER
          </button>
        </div>
      );
    }
  }

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
      <div className="flex items-center gap-4">
        {authButtonContent}
        <ThemeSwitcher variant="minimal" />
      </div>
    </header>
  );
}
