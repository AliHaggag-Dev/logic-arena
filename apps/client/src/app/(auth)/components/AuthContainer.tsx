"use client";
import React from "react";

interface Props {
  children: React.ReactNode;
  isMobile: boolean;
}

export function AuthContainer({ children, isMobile }: Props) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-primary font-sans selection:bg-accent/30 relative overflow-hidden px-4 py-16">
      <style>{`
        @keyframes auth-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background: mesh gradient + grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--accent-rgb),0.08) 0%, transparent 70%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(var(--accent-rgb),0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Card with gradient border */}
      <div
        className="relative w-full z-20"
        style={{
          maxWidth: 420,
          animation: 'auth-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Gradient border wrapper */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.4) 0%, rgba(var(--accent-rgb),0.05) 50%, rgba(var(--accent-rgb),0.2) 100%)',
          }}
        />
        {/* Card body */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'color-mix(in srgb, var(--card) 90%, transparent)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            padding: isMobile ? '28px 24px' : '40px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
