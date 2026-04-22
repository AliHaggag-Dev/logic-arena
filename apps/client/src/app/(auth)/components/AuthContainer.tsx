import React from "react";
import { AuthBackground } from "./AuthBackground";

interface Props {
  isMobile: boolean;
  nodeName: string;
  children: React.ReactNode;
}

export function AuthContainer({ isMobile, nodeName, children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary font-mono selection:bg-accent/30 relative overflow-hidden p-4 pt-16 sm:p-6 sm:pt-20">
      <AuthBackground />
      <div className={`w-full max-w-[420px] bg-card/60 backdrop-blur-xl border border-accent/20 rounded-xl ${isMobile ? "p-6" : "p-8"} relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(var(--accent-rgb),0.05)] animate-[fadeInScale_0.4s_ease-out] ${isMobile ? "shadow-[inset_3px_0_0_0_var(--accent)]" : ""}`}>
        
        {/* Decorative Corner Accents */}
        {!isMobile && (
          <>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/60 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/60 rounded-br-xl" />
          </>
        )}

        <div className="absolute top-3 right-4 text-[9px] text-accent/30 tracking-[0.2em] pointer-events-none">
          {nodeName}
        </div>

        {children}
      </div>
    </div>
  );
}
