"use client";

import React from "react";
import dynamic from "next/dynamic";
import { SocketContext } from "../../context/SocketContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useDashboardAuth } from "./components/layout/hooks/useDashboardAuth";
import { useChallengeSystem } from "./components/layout/hooks/useChallengeSystem";
import { DashboardSidebar } from "./components/layout/components/DashboardSidebar";
import { DashboardHeader } from "./components/layout/components/DashboardHeader";
import { ChallengeModal } from "./components/layout/components/ChallengeModal";
import { ToastNotification } from "./components/layout/components/ToastNotification";

const MobileNav = dynamic(() => import("../../components/MobileNav").then((mod) => mod.MobileNav), { ssr: false });
const MobileHeader = dynamic(() => import("../../components/MobileHeader").then((mod) => mod.MobileHeader), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { username, handleLogout } = useDashboardAuth();
  const { incomingChallenge, setIncoming, toast, sendChallenge, acceptChallenge } = useChallengeSystem();
  const isMobile = useMediaQuery("(max-width: 768px)");

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
        {isMobile && <MobileHeader />}

        {!isMobile && <DashboardSidebar username={username} onLogout={handleLogout} />}

        <main className={`flex-1 flex flex-col overflow-x-clip bg-bg-primary relative scroll-smooth scrollbar-thin scrollbar-thumb-accent/10 scrollbar-track-transparent ${isMobile ? "pt-12 pb-[calc(80px+env(safe-area-inset-bottom))] max-w-[100vw]" : ""}`}>
          {!isMobile && <DashboardHeader username={username} />}
          {children}
        </main>

        {isMobile && <MobileNav />}

        <ToastNotification toast={toast} isMobile={isMobile} />

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
