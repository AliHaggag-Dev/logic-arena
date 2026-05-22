'use client';

import { useEffect, useRef, useState } from 'react';

interface DocSection {
  id: string;
  label: string;
  short: string;
}

const DOC_SECTIONS: DocSection[] = [
  { id: 'docs-intro',       label: 'Introduction',     short: 'INTRO'   },
  { id: 'docs-quick-ref',   label: 'Quick Reference',  short: 'QUICK'   },
  { id: 'docs-commands',    label: 'Commands',         short: 'CMDS'    },
  { id: 'docs-queries',     label: 'Query Functions',  short: 'QUERY'   },
  { id: 'docs-identifiers', label: 'Identifiers',      short: 'IDS'     },
  { id: 'docs-advanced',    label: 'Advanced',         short: 'ADVANCED'},
  { id: 'docs-energy',      label: 'Energy Costs',     short: 'ENERGY'  },
  { id: 'docs-rotation',    label: 'Rotation System',  short: 'ROTATE'  },
  { id: 'docs-challenges',  label: 'Challenges',       short: 'ALGO'    },
  { id: 'docs-tactics',     label: 'Battle Tactics',   short: 'TACTICS' },
  { id: 'docs-playground',  label: 'Playground',       short: 'PLAY'    },
];

interface DocsSectionNavProps {
  isMobile: boolean;
}

export function DocsSectionNav({ isMobile }: DocsSectionNavProps) {
  const [activeId, setActiveId] = useState<string>(DOC_SECTIONS[0].id);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 },
    );

    DOC_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Auto-scroll the mobile pill strip to keep active pill visible
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;
    const activeBtn = scrollContainerRef.current.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId, isMobile]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const OFFSET = isMobile ? 110 : 80;
    window.scrollTo({ top: el.offsetTop - OFFSET, behavior: 'smooth' });
  };

  /* ─────────────────────────────── MOBILE ─────────────────────────────────
   * Horizontal scrollable pill strip fixed just below the dashboard header.
   * iOS-segment-control aesthetic: frosted glass, gliding accent pill.
   * ──────────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="docs-snav-mobile-container">
        {/* Fade edges — left */}
        <div className="docs-snav-mobile-fade-left" />
        {/* Fade edges — right */}
        <div className="docs-snav-mobile-fade-right" />

        <div
          ref={scrollContainerRef}
          className="docs-snav-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '0 24px',
          }}
        >
          {DOC_SECTIONS.map(({ id, label, short }) => (
            <button
              key={id}
              type="button"
              data-active={activeId === id ? 'true' : 'false'}
              className="docs-snav-pill"
              onClick={() => scrollToSection(id)}
              aria-label={`Go to ${label}`}
            >
              {short}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────── DESKTOP ────────────────────────────────
   * Compact vertical floating TOC anchored to the RIGHT EDGE of the viewport.
   * top:18% keeps it above the scroll-to-top tab (bottom:22%).
   * Uses docs.css classes for full theme-adaptive styling.
   * ──────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="docs-snav-panel"
      style={{
        position: 'fixed',
        right: 0,
        top: '18%',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 8px',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(var(--accent-rgb), 0.12)',
        borderRight: 'none',
        borderRadius: '16px 0 0 16px',
        boxShadow: '-6px 0 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <p className="docs-snav-header">ON THIS PAGE</p>
      <div className="docs-snav-divider" />

      {DOC_SECTIONS.map(({ id, label, short }) => (
        <button
          key={id}
          type="button"
          data-active={activeId === id ? 'true' : 'false'}
          className="docs-snav-desktop-item"
          onClick={() => scrollToSection(id)}
          aria-label={`Go to ${label}`}
        >
          <span className="docs-snav-dot" />
          {short}
        </button>
      ))}
    </div>
  );
}
