"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DesktopTOC } from "./DesktopTOC";
import { useActiveSection } from "./hooks";
import { MobileTOC } from "./MobileTOC";
import type { PublicPageLayoutProps } from "./types";

export function PublicPageLayout({
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
      className="min-h-dvh relative"
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

export default PublicPageLayout;
