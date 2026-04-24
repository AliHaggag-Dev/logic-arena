"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { SectionId, SECTIONS } from "./Shared";

interface SettingsLayoutProps {
  activeSection: SectionId | null;
  onSectionChange: (section: SectionId | null) => void;
  isMobile: boolean;
  children: React.ReactNode;
}

export function SettingsLayout({
  activeSection,
  onSectionChange,
  isMobile,
  children,
}: SettingsLayoutProps) {
  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .accordion-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s ease;
        }
        .accordion-content.open {
          grid-template-rows: 1fr;
        }
        .accordion-inner {
          overflow: hidden;
        }
      `}</style>

      <div className="min-h-screen bg-bg-primary font-mono">
        {/* Page title — matches other dashboard pages (inline, not a second header bar) */}
        <div className={`${isMobile ? "px-4 pt-4 pb-3" : "max-w-5xl mx-auto pt-16 px-6"}`}>
          <div className="mb-0 border-b border-accent/20 pb-6">
            <h1 className={`text-accent font-black tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] mb-2 ${isMobile ? "text-2xl tracking-[0.1em]" : "text-4xl"}`}>
              OPERATOR SETTINGS
            </h1>
            <h2 className="text-accent/60 text-xs tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_var(--color-emerald-500)] shrink-0"></span>
              System Configuration | Neural Parameters
            </h2>
          </div>
        </div>

        {isMobile ? (
          /* ── MOBILE: Accordion layout ── */
          <div className="px-4 py-4 flex flex-col gap-3">
            {SECTIONS.map((section) => {
              const isOpen = activeSection === section.id;
              return (
                <div
                  key={section.id}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "border-accent/40 shadow-[inset_3px_0_0_var(--accent),0_0_20px_rgba(var(--accent-rgb),0.08)]"
                      : "border-accent/10"
                  }`}
                  style={isOpen ? { boxShadow: "inset 3px 0 0 var(--accent), 0 0 20px rgba(var(--accent-rgb),0.08)" } : {}}
                >
                  <button
                    onClick={() => onSectionChange(isOpen ? null : section.id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-bg-secondary min-h-[56px]"
                  >
                    <span className={`text-[11px] font-black tracking-[0.25em] ${isOpen ? "text-accent" : "text-text-secondary"}`}>
                      {section.shortLabel}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-accent/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div className={`accordion-content ${isOpen ? "open" : ""}`}>
                    <div className="accordion-inner">
                      <div className="p-5 bg-bg-primary border-t border-accent/10">
                        {isOpen && children}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── DESKTOP: Two-column layout ── */
          <div className="flex max-w-5xl mx-auto px-6">
            {/* Left sidebar */}
            <aside className="w-[180px] shrink-0 border-r border-accent/[0.08] bg-bg-secondary/50 sticky top-[60px] h-fit flex flex-col py-4">
              <div className="text-[8px] tracking-[0.3em] text-accent/25 font-bold px-4 pb-3 uppercase">
                Sections
              </div>
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`w-full text-left px-4 py-3 text-[10px] font-bold tracking-[0.18em] transition-all duration-150 border-l-[3px] ${
                      isActive
                        ? "border-accent bg-accent/[0.05] text-accent [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.5)]"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-accent/[0.02] hover:border-accent/20"
                    }`}
                  >
                    {section.shortLabel}
                  </button>
                );
              })}
            </aside>

            {/* Right panel */}
            <main className="flex-1 px-8 py-8 max-w-2xl">
              {children}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
