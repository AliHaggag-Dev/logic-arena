"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "pwa-install-dismissed";

export function PWAInstallPrompt() {
  const pathname = usePathname() || "";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Never show if already dismissed
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show immediately on /dashboard, else wait 30s
      const delay = pathname.startsWith("/dashboard") ? 0 : 30_000;
      setTimeout(() => setVisible(true), delay);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [pathname]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
    setInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <>
      <style>{`
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .pwa-prompt {
          animation: pwaSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
      `}</style>

      <div
        className="pwa-prompt fixed bottom-[calc(80px+env(safe-area-inset-bottom)+12px)] left-1/2 z-[9999] w-[calc(100vw-32px)] max-w-sm"
        role="dialog"
        aria-label="Install Logic Arena"
      >
        {/* Card */}
        <div
          className="relative rounded-xl border border-accent/25 bg-bg-secondary/95 backdrop-blur-2xl p-4 shadow-[0_0_40px_rgba(var(--accent-rgb),0.15),inset_0_0_20px_rgba(var(--accent-rgb),0.04)]"
        >
          {/* Top glow bar */}
          <div className="absolute top-0 left-6 right-6 h-[1px] rounded-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

          <div className="flex items-start gap-3">
            {/* Icon */}
            <span
              className="text-[28px] leading-none mt-0.5 drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]"
              aria-hidden="true"
            >
              ⬢
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-[0.15em] uppercase text-accent leading-tight [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.5)]">
                Install Logic Arena
              </p>
              <p className="mt-0.5 text-[10.5px] text-text-secondary/80 tracking-wide leading-relaxed">
                Play offline&nbsp;•&nbsp;Faster load&nbsp;•&nbsp;No browser UI
              </p>
            </div>

            {/* Dismiss X */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="text-text-secondary/40 hover:text-text-secondary transition-colors text-[18px] leading-none w-6 h-6 flex items-center justify-center rounded"
            >
              ×
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              id="pwa-install-btn"
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 py-2 text-[11px] font-bold tracking-[0.18em] uppercase rounded-lg bg-accent text-bg-primary hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_0_16px_rgba(var(--accent-rgb),0.4)] disabled:opacity-60"
            >
              {installing ? "INSTALLING…" : "INSTALL"}
            </button>
            <button
              id="pwa-dismiss-btn"
              onClick={handleDismiss}
              className="px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase rounded-lg border border-accent/20 text-text-secondary/70 hover:border-accent/40 hover:text-text-secondary transition-all duration-150"
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Augment the global Window interface for the non-standard event
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    prompt(): Promise<void>;
  }
}
