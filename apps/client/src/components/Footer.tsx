"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { DesktopLayout } from "./footer/DesktopLayout";
import { MobileLayout } from "./footer/MobileLayout";
import { BottomBar } from "./footer/BottomBar";

// Routes where the footer should be hidden entirely
const FOOTER_SUPPRESSED_PATHS = ["/arena"];

export default function Footer() {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Suppress footer on full-screen app routes (e.g. the 3D arena)
  if (FOOTER_SUPPRESSED_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) return null;

  return (
    <>
      <style>{`
        @keyframes footer-glitch {
          0%, 100% { clip-path: none; transform: none; }
          92%       { clip-path: none; transform: none; }
          93%       { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translateX(-3px); }
          94%       { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translateX(3px); }
          95%       { clip-path: none; transform: none; }
          97%       { clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%); transform: translateX(-2px); }
          98%       { clip-path: none; transform: none; }
        }
        @keyframes status-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
        .footer-brand-name:hover {
          animation: footer-glitch 0.6s steps(1) forwards;
        }
      `}</style>

      <footer
        className="relative border-t border-accent/50 bg-bg-primary font-mono overflow-hidden w-full"
        aria-label="Site footer"
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--accent-rgb),0.015) 3px, rgba(var(--accent-rgb),0.015) 4px)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {!isMobile && <DesktopLayout />}
        {isMobile && <MobileLayout />}

        <BottomBar isMobile={isMobile} />
      </footer>
    </>
  );
}
