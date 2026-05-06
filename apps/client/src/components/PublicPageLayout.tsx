"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

export interface PublicSection {
  id: string;
  title: string;
  /** Short label used in the sidebar TOC (defaults to title if omitted) */
  label?: string;
}

export interface PublicPageLayoutProps {
  /** Page-level badge text (e.g. "LEGAL DOCUMENT", "PLATFORM GUIDE") */
  badge: string;
  /** Main page heading */
  title: string;
  /** One-line subtitle shown below the heading */
  subtitle: string;
  /** ISO date string (e.g. "May 2026") */
  lastUpdated: string;
  /** Back link href + label */
  backHref?: string;
  backLabel?: string;
  /** Ordered sections — ids must match the <section id="..."> elements in children */
  sections: PublicSection[];
  children: React.ReactNode;
}

/* ─── Active-section tracker hook ───────────────────────── */

function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  const visibleSections = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleSections.current[entry.target.id] = entry.isIntersecting;
        });

        // Find the first section in the original order that is currently visible
        const firstVisible = ids.find((id) => visibleSections.current[id]);
        if (firstVisible) {
          setActive(firstVisible);
        }
      },
      // -120px top margin perfectly offsets the 80px global header + some breathing room.
      // -40% bottom margin ensures we don't prematurely highlight the next section.
      { rootMargin: "-120px 0px -40% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/* ─── Mobile Bottom-Sheet component ─────────────────────── */

interface MobileTOCProps {
  sections: PublicSection[];
  active: string;
}

function MobileTOC({ sections, active }: MobileTOCProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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

/* ─── Desktop Sidebar TOC ────────────────────────────────── */

interface DesktopTOCProps {
  sections: PublicSection[];
  active: string;
}

function DesktopTOC({ sections, active }: DesktopTOCProps) {
  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
      <motion.div
        className="sticky top-32 rounded-2xl border border-accent/15 overflow-hidden bg-bg-secondary/60"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "inset 0 0 30px rgba(var(--accent-rgb), 0.03), 0 0 0 1px rgba(var(--accent-rgb), 0.05)",
        }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-accent/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 6px var(--accent)" }} />
          <span className="text-[9px] font-black tracking-[0.4em] text-accent/50 uppercase">
            On This Page
          </span>
        </div>

        {/* Sidebar glow line top-left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), 0.4), transparent)" }}
        />

        <nav className="px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {sections.map((section, i) => {
              const isActive = section.id === active;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(section.id)}
                    className={`group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer hover:translate-x-1 ${isActive ? "bg-accent/10" : "hover:bg-accent/10"}`}
                  >
                    {/* Active indicator bar */}
                    <div className="relative shrink-0 w-0.5 h-4 rounded-full overflow-hidden" style={{ background: "rgba(var(--accent-rgb), 0.15)" }}>
                      {isActive && (
                        <motion.div
                          layoutId="activeTOCIndicator"
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "var(--accent)",
                            boxShadow: "0 0 8px var(--accent)",
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-black tracking-widest shrink-0 w-4"
                      style={{ color: isActive ? "var(--accent)" : "rgba(var(--accent-rgb), 0.3)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="text-[12px] font-medium leading-snug transition-colors duration-200"
                      style={{ color: isActive ? "var(--accent)" : "rgba(var(--accent-rgb), 0.55)" }}
                    >
                      {section.label ?? section.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.div>
    </aside>
  );
}

/* ─── Main Layout ────────────────────────────────────────── */

export default function PublicPageLayout({
  badge,
  title,
  subtitle,
  lastUpdated,
  backHref = "/dashboard",
  backLabel = "Back to Home",
  sections,
  children,
}: PublicPageLayoutProps) {
  const sectionIds = sections.map((s) => s.id);
  const active = useActiveSection(sectionIds);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* ── Ambient background layer ──────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Scanlines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--accent-rgb),0.008) 3px, rgba(var(--accent-rgb),0.008) 4px)",
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.025) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        {/* Radial top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
          style={{
            background: "radial-gradient(ellipse at center top, rgba(var(--accent-rgb), 0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Page content ──────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">

        {/* Back link */}
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2.5 mb-10 transition-all duration-300"
          style={{ color: "rgba(var(--accent-rgb), 0.6)" }}
        >
          <ArrowLeft
            size={14}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          <span
            className="text-[10px] font-black tracking-[0.3em] uppercase transition-colors duration-300 group-hover:text-accent"
          >
            {backLabel}
          </span>
        </Link>

        {/* ── Hero header ───────────────────────────────── */}
        <header
          className="mb-10 lg:mb-14 relative rounded-2xl overflow-hidden"
          style={{
            background: "rgba(var(--accent-rgb), 0.04)",
            border: "1px solid rgba(var(--accent-rgb), 0.18)",
            boxShadow: "inset 0 0 40px rgba(var(--accent-rgb), 0.04)",
          }}
        >
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{
              background: "linear-gradient(to bottom, rgba(var(--accent-rgb),0.2), var(--accent), rgba(var(--accent-rgb),0.2))",
              boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.6)",
            }}
          />
          {/* Top-right corner gradient */}
          <div
            className="absolute top-0 right-0 w-64 h-full pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(var(--accent-rgb), 0.07), transparent)" }}
          />
          {/* Bottom border glow */}
          <div
            className="absolute bottom-0 left-6 right-6 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(var(--accent-rgb), 0.3), transparent)" }}
          />

          <div className="px-8 sm:px-12 py-8 sm:py-10 relative z-10">
            {/* Badge */}
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
              />
              <span
                className="text-[9px] font-black tracking-[0.5em] uppercase"
                style={{ color: "rgba(var(--accent-rgb), 0.55)", fontFamily: "var(--font-mono)" }}
              >
                {badge}
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[0.15em] uppercase mb-3"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--accent)",
                textShadow: "0 0 40px rgba(var(--accent-rgb), 0.35)",
              }}
            >
              {title}
            </h1>

            {/* Divider line */}
            <div
              className="h-px w-full max-w-md mb-4"
              style={{ background: "linear-gradient(to right, rgba(var(--accent-rgb), 0.5), transparent)" }}
            />

            {/* Subtitle */}
            <p
              className="text-sm sm:text-base leading-relaxed mb-5 max-w-2xl"
              style={{ color: "rgba(var(--accent-rgb), 0.65)", fontFamily: "var(--font-mono)" }}
            >
              {subtitle}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap">
              <span
                className="text-[10px] font-black tracking-[0.25em] uppercase"
                style={{ color: "rgba(var(--accent-rgb), 0.4)", fontFamily: "var(--font-mono)" }}
              >
                Last updated:{" "}
                <span style={{ color: "var(--accent)", textShadow: "0 0 10px rgba(var(--accent-rgb), 0.4)" }}>
                  {lastUpdated}
                </span>
              </span>
              <div
                className="h-3 w-px"
                style={{ background: "rgba(var(--accent-rgb), 0.2)" }}
              />
              <span
                className="text-[10px] font-black tracking-[0.25em] uppercase"
                style={{ color: "rgba(var(--accent-rgb), 0.4)", fontFamily: "var(--font-mono)" }}
              >
                {sections.length} Sections
              </span>
            </div>
          </div>
        </header>

        {/* ── Main layout: sidebar + content ────────────── */}
        <div className="flex gap-8 xl:gap-12 relative">
          {/* Desktop sidebar */}
          <DesktopTOC sections={sections} active={active} />

          {/* Content area */}
          <main
            className="flex-1 min-w-0 flex flex-col gap-4 pb-24 lg:pb-8"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom-sheet TOC */}
      <MobileTOC sections={sections} active={active} />
    </div>
  );
}

/* ─── Re-usable section wrapper ─────────────────────────── */

export interface PublicSectionCardProps {
  id: string;
  index: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function PublicSectionCard({ id, index, title, icon, children }: PublicSectionCardProps) {
  return (
    <section
      id={id}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 bg-bg-secondary/50"
      style={{
        border: "1px solid rgba(var(--accent-rgb), 0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        scrollMarginTop: "6rem",
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top left, rgba(var(--accent-rgb), 0.04) 0%, transparent 60%)" }}
      />

      {/* Left accent line */}
      <div
        className="absolute left-0 top-4 bottom-4 w-px transition-all duration-300"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), 0.3), transparent)",
        }}
      />

      {/* Section header */}
      <div
        className="flex items-center gap-4 px-6 sm:px-8 py-5 border-b"
        style={{ borderColor: "rgba(var(--accent-rgb), 0.1)" }}
      >
        {/* Index number */}
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black tracking-wider"
          style={{
            background: "rgba(var(--accent-rgb), 0.08)",
            border: "1px solid rgba(var(--accent-rgb), 0.2)",
            color: "rgba(var(--accent-rgb), 0.6)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {String(index).padStart(2, "0")}
        </div>

        {/* Icon */}
        <div style={{ color: "var(--accent)" }}>
          {icon}
        </div>

        {/* Title */}
        <h2
          className="text-[12px] sm:text-[13px] font-black tracking-[0.2em] uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
        >
          {title}
        </h2>
      </div>

      {/* Content area */}
      <div className="px-6 sm:px-8 py-6">
        {children}
      </div>
    </section>
  );
}

/* ─── Body text helper ───────────────────────────────────── */

export function PublicBody({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[13px] sm:text-[14px] leading-[1.9] tracking-[0.02em]"
      style={{ color: "rgba(var(--accent-rgb), 0.7)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </p>
  );
}

/* ─── Definition block (for legal terms) ────────────────── */

export function PublicDefinition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-3 sm:gap-8 px-5 sm:px-8 py-5 border-b last:border-0 hover:bg-accent/5 transition-colors duration-300"
      style={{ borderColor: "rgba(var(--accent-rgb), 0.1)" }}
    >
      <div className="shrink-0 sm:w-48 mt-0.5 flex items-start gap-3">
        <div className="mt-[6px] w-1 h-1 rounded-sm bg-accent/60" />
        <span
          className="text-[11px] font-black tracking-[0.25em] uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
          }}
        >
          {term}
        </span>
      </div>
      <p
        className="text-[13px] leading-[1.8] flex-1"
        style={{ color: "rgba(var(--accent-rgb), 0.7)", fontFamily: "var(--font-mono)" }}
      >
        {children}
      </p>
    </div>
  );
}

/* ─── Footer CTA banner ──────────────────────────────────── */

export function PublicFooterCTA({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl px-6 sm:px-8 py-6 text-center"
      style={{
        background: "rgba(var(--accent-rgb), 0.04)",
        border: "1px solid rgba(var(--accent-rgb), 0.12)",
      }}
    >
      <p
        className="text-[11px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "rgba(var(--accent-rgb), 0.55)", fontFamily: "var(--font-mono)" }}
      >
        {children}
      </p>
    </div>
  );
}
