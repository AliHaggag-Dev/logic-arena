"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock, User, Shield, Palette, Settings, Bell, LucideIcon } from "lucide-react";
import { SectionId, SECTIONS } from "./shared";

interface SettingsLayoutProps {
  activeSection: SectionId | null;
  onSectionChange: (section: SectionId | null) => void;
  isMobile: boolean;
  isGuest: boolean;
  renderSection: (id: SectionId) => React.ReactNode;
}

const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  identity: User,
  security: Shield,
  appearance: Palette,
  arena: Settings,
  notifications: Bell,
};

export function SettingsLayout({
  activeSection,
  onSectionChange,
  isMobile,
  isGuest,
  renderSection,
}: SettingsLayoutProps) {
  const router = useRouter();
  return (
    <>
      <div className="min-h-screen bg-bg-primary font-mono">
        {/* Page title — matches other dashboard pages (inline, not a second header bar) */}
        <div className={`${isMobile ? "px-4 pt-4 pb-3" : "max-w-5xl mx-auto pt-16 px-6"}`}>
          <div className="mb-0 border-b border-accent/20 pb-6">
            <h1 className={`text-accent font-black tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] mb-2 ${isMobile ? "text-2xl tracking-[0.1em]" : "text-4xl"}`}>
              SETTINGS
            </h1>
            <h2 className="text-accent/60 text-xs tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_var(--color-emerald-500)] shrink-0"></span>
              Account & Preferences
            </h2>
          </div>

          {isGuest && (
            <div className={`mt-6 p-6 border border-dashed border-accent/20 rounded-2xl bg-accent/[0.02] backdrop-blur-sm animate-[fadeIn_0.35s_ease] flex flex-col items-center text-center`}>
              <Lock className="w-8 h-8 mb-3 text-accent/60 opacity-50" />
              <h3 className="text-accent font-black tracking-widest text-[14px] mb-1.5 uppercase">Account Required</h3>
              <p className="text-accent/40 text-[10px] tracking-[0.12em] max-w-[480px] uppercase leading-relaxed">
                Sign in or create a free account to save your settings and preferences.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="px-6 py-3 bg-accent/10 border border-accent/30 rounded-lg text-[10px] font-black tracking-widest text-accent hover:bg-accent/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]"
                >
                  [+] CREATE ACCOUNT
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="px-6 py-3 bg-bg-secondary/50 border border-accent/20 rounded-lg text-[10px] font-black tracking-widest text-accent/70 hover:bg-accent/5 hover:text-accent transition-all cursor-pointer"
                >
                  LOGIN
                </button>
              </div>
            </div>
          )}
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
                >
                  <button
                    type="button"
                    onClick={() => onSectionChange(isOpen ? null : section.id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-bg-secondary min-h-[56px] cursor-pointer"
                  >
                    <span className={`text-[11px] font-black tracking-[0.25em] ${isOpen ? "text-accent" : "text-text-secondary"}`}>
                      {section.shortLabel}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-accent/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="p-5 bg-bg-primary border-t border-accent/10">
                        {isOpen && renderSection(section.id)}
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
                const Icon = SECTION_ICONS[section.id];
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => onSectionChange(section.id)}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3 text-[10px] font-bold tracking-[0.18em] transition-all duration-150 border-l-[3px] cursor-pointer ${
                      isActive
                        ? "border-accent bg-accent/[0.05] text-accent [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.5)]"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-accent/[0.02] hover:border-accent/20"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-accent drop-shadow-[0_0_4px_rgba(var(--accent-rgb),0.6)]" : "text-text-secondary/60"} />
                    {section.shortLabel}
                  </button>
                );
              })}
            </aside>

            {/* Right panel */}
            <main className="flex-1 px-8 py-8 max-w-2xl">
              {activeSection && renderSection(activeSection)}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
