"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PortraitGuard() {
  const pathname = usePathname() || "";
  const [showGuard, setShowGuard] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAllowedLandscape = pathname.startsWith("/arena");

    // Attempt to lock to portrait natively on Android for non-arena pages
    if (!isAllowedLandscape) {
      try {
        interface ExtendedScreenOrientation extends ScreenOrientation {
          lock?: (orientation: string) => Promise<void>;
        }
        
        const orientation = screen?.orientation as ExtendedScreenOrientation | undefined;
        
        if (typeof orientation?.lock === "function") {
          orientation.lock("portrait").catch(() => {
            // Ignore errors (iOS, unsupported, or user hasn't interacted)
          });
        }
      } catch (e) {}
    }

    const checkOrientation = () => {
      // Don't block if we are in an allowed page (like /arena)
      if (pathname.startsWith("/arena")) {
        setShowGuard(false);
        return;
      }

      // We only want to block phones in landscape.
      // Phones in landscape typically have a very small innerHeight (e.g. 390px for iPhone 12 Pro).
      // Tablets in landscape usually have innerHeight >= 700px.
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const isShortScreen = window.innerHeight < 600;

      if (isLandscape && isShortScreen) {
        setShowGuard(true);
      } else {
        setShowGuard(false);
      }
    };

    // Check immediately
    checkOrientation();

    // Listen for orientation/resize changes
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    mediaQuery.addEventListener("change", checkOrientation);
    window.addEventListener("resize", checkOrientation);

    return () => {
      mediaQuery.removeEventListener("change", checkOrientation);
      window.removeEventListener("resize", checkOrientation);
    };
  }, [pathname]);

  if (!showGuard) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-bg-primary flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl">
      <div className="relative mb-8 w-24 h-24 animate-[rotate-phone_2s_ease-in-out_infinite]">
        {/* Phone frame */}
        <div className="absolute inset-0 border-4 border-accent rounded-2xl shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-accent/50 rounded-full" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-accent/50" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3 tracking-[0.15em] uppercase">
        Rotate Device
      </h2>
      <p className="text-sm text-text-secondary/80 max-w-[280px] leading-relaxed">
        This page is optimized for portrait mode. Please rotate your phone vertically to continue.
      </p>

      <style>{`
        @keyframes rotate-phone {
          0%, 100% { transform: rotate(-90deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
