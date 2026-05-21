import React from "react";
import { Hexagon } from "lucide-react";

interface Props {
  isMobile: boolean;
  subtitle: string;
}

export function AuthHeader({ isMobile, subtitle }: Props) {
  return (
    <div className="mb-8 text-center flex flex-col items-center gap-3">
      {/* Logo icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.15), rgba(var(--accent-rgb),0.05))',
          border: '1px solid rgba(var(--accent-rgb),0.25)',
          boxShadow: '0 0 20px rgba(var(--accent-rgb),0.15)',
        }}
      >
        <Hexagon className="w-6 h-6 text-accent" aria-hidden="true" />
      </div>

      {/* Brand name */}
      <div>
        <h1
          className="font-black tracking-[0.15em] uppercase text-accent"
          style={{ fontSize: isMobile ? 22 : 26 }}
        >
          LOGIC ARENA
        </h1>
        <p className="text-text-secondary text-sm mt-1 tracking-wide">{subtitle}</p>
      </div>
    </div>
  );
}
