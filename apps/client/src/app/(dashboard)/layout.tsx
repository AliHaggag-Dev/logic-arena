"use client";

import React from "react";
import { SocketContext } from "../../context/SocketContext";
import { useDashboardAuth } from "./components/layout/hooks/useDashboardAuth";
import { useChallengeSystem } from "./components/layout/hooks/useChallengeSystem";
import { DashboardSidebar } from "./components/layout/components/DashboardSidebar";
import { DashboardHeader } from "./components/layout/components/DashboardHeader";
import { ChallengeModal } from "./components/layout/components/ChallengeModal";
import { ToastNotification } from "./components/layout/components/ToastNotification";
import { PWAInstallPrompt } from "../../components/PWAInstallPrompt";
import { MobileHeader } from './components/MobileHeader';
import { MobileNav } from './components/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { username, avatarUrl, handleLogout } = useDashboardAuth();
  const { incomingChallenge, setIncoming, toast, sendChallenge, acceptChallenge } = useChallengeSystem();

  return (
    <SocketContext.Provider value={{ sendChallenge }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex min-h-screen bg-bg-primary font-mono selection:bg-accent/30">
        <div className="hidden md:block shrink-0">
          <DashboardSidebar username={username} avatarUrl={avatarUrl} onLogout={handleLogout} />
        </div>

        <main className="flex-1 flex flex-col overflow-x-clip bg-bg-primary relative scroll-smooth scrollbar-thin scrollbar-thumb-accent/10 scrollbar-track-transparent pt-12 md:pt-0 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 max-w-[100vw] md:max-w-none">
          <div className="hidden md:block sticky top-0 z-[60]">
            <DashboardHeader username={username} avatarUrl={avatarUrl} />
          </div>
          {children}
        </main>

        <ToastNotification toast={toast} isMobile={false} />

        {/* PWA install prompt — appears after 30s or immediately on /dashboard */}
        <PWAInstallPrompt />

        {incomingChallenge && (
          <ChallengeModal
            challenge={incomingChallenge}
            onAccept={(id) => {
              acceptChallenge(id);
              setIncoming(null);
            }}
            onDecline={() => setIncoming(null)}
          />
        )}
      </div>
    </SocketContext.Provider>
  );
}
