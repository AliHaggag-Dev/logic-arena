"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

import { scrollToPublicSection } from "./navigation";
import type { PublicSection } from "./types";

export interface MobileTOCProps {
  sections: PublicSection[];
  active: string;
}

export function MobileTOC({ sections, active }: MobileTOCProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleNavClick = (id: string) => {
    scrollToPublicSection(id);
    setOpen(false);
  };

  const activeSection = sections.find((s) => s.id === active);

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div
          className="mx-3 mb-3 rounded-2xl border border-accent/30 overflow-hidden bg-bg-secondary/85"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 -4px 40px rgba(var(--accent-rgb), 0.12), 0 0 0 1px rgba(var(--accent-rgb), 0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            aria-label="Toggle table of contents"
          >
            <div className="flex items-center gap-3">
              <Menu size={14} className="text-accent/60 shrink-0" />
              <span className="text-[11px] font-black tracking-[0.2em] text-accent/50 uppercase">
                On this page
              </span>
              {activeSection && (
                <>
                  <ChevronRight size={10} className="text-accent/30" />
                  <span className="text-[11px] font-bold tracking-[0.05em] text-accent truncate max-w-[160px]">
                    {activeSection.label ?? activeSection.title}
                  </span>
                </>
              )}
            </div>
            <ChevronDown
              size={14}
              className="text-accent/50 transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
        </div>
      </div>

      {/* Bottom sheet drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-accent/20 border-b-0 overflow-hidden bg-bg-secondary/95"
            style={{
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              boxShadow: "0 -20px 60px rgba(var(--accent-rgb), 0.15)",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 rounded-full bg-accent/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-accent/10">
              <span className="text-[10px] font-black tracking-[0.35em] text-accent/50 uppercase">
                Table of Contents
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close table of contents"
                className="w-7 h-7 rounded-full border border-accent/20 flex items-center justify-center text-accent/50 hover:text-accent hover:border-accent/40 transition-all"
              >
                <X size={12} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="px-4 py-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
              <ul className="flex flex-col gap-1">
                {sections.map((section, i) => {
                  const isActive = section.id === active;
                  return (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(section.id)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "bg-accent/10 border-accent/30" : "bg-transparent border-transparent"}`}
                        style={{
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                      >
                        <span
                          className="text-[10px] font-black tracking-widest shrink-0 w-5 text-center"
                          style={{ color: isActive ? "var(--accent)" : "rgba(var(--accent-rgb), 0.35)" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="text-[13px] font-medium tracking-wide leading-snug"
                          style={{ color: isActive ? "var(--accent)" : "rgba(var(--accent-rgb), 0.65)" }}
                        >
                          {section.label ?? section.title}
                        </span>
                        {isActive && (
                          <div
                            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
