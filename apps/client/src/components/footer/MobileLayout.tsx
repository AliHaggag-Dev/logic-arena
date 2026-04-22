"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ACCORDION_SECTIONS } from './constants';
import { ChevronIcon, GitHubIcon, LinkedinIcon, PortfolioIcon } from './Icons';

function MobileSocialIcons() {
  const icons = [
    { label: "GitHub", el: <GitHubIcon size={22} /> },
    { label: "LinkedIn", el: <LinkedinIcon size={22} /> },
    { label: "Portfolio", el: <PortfolioIcon size={22} /> },
  ];
  return (
    <div className="flex items-center gap-3 mt-5">
      {icons.map(({ label, el }) => (
        <a
          key={label}
          href="#"
          aria-label={label}
          className="flex items-center justify-center rounded-xl border border-accent/30 bg-bg-secondary/60 text-accent/60 hover:text-accent hover:border-accent/60 hover:bg-accent/10 transition-all duration-300"
          style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
          onTouchStart={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 8px rgba(var(--accent-rgb),0.6))")}
          onTouchEnd={(e) => (e.currentTarget.style.filter = "")}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 8px rgba(var(--accent-rgb),0.6))")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
        >
          {el}
        </a>
      ))}
    </div>
  );
}

function AccordionCard({
  title,
  links,
  isOpen,
  onToggle,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentHeight = links.length * 44 + 16;

  return (
    <div
      className="border-t border-accent/50 w-full"
      style={{
        boxShadow: isOpen ? "inset 3px 0 0 var(--accent)" : "none",
        transition: "box-shadow 200ms ease",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between bg-transparent text-left"
        style={{ minHeight: 44, padding: "0 20px" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-accent/70 text-xs font-mono select-none">⌐</span>
          <span className="text-[10px] font-black tracking-[0.38em] uppercase text-accent">
            {title}
          </span>
          <span className="text-accent/70 text-xs font-mono select-none">¬</span>
        </div>
        <span className="text-accent/60 shrink-0">
          <ChevronIcon expanded={isOpen} />
        </span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
          overflow: "hidden",
          transition: "max-height 300ms ease",
        }}
      >
        <div className="flex flex-col" style={{ padding: "8px 0 8px 0" }}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group flex items-center text-[11.5px] font-mono tracking-[0.15em] uppercase text-accent/40 hover:text-accent transition-all duration-300"
              style={{ minHeight: 44, padding: "0 20px" }}
            >
              <span className="inline-block w-0 overflow-hidden group-hover:w-3 text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.8)] transition-all duration-300 ease-out">
                ›
              </span>
              <span className="group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)] group-hover:translate-x-0.5 transition-all duration-300">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileLayout() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (title: string) =>
    setOpenSection((prev) => (prev === title ? null : title));

  return (
    <div className="relative z-10 w-full">
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 border border-accent/40 rounded-lg flex items-center justify-center bg-accent/5">
            <span className="text-accent">⬡</span>
          </div>
          <h2 className="footer-brand-name text-[16px] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] cursor-default select-none">
            LOGIC ARENA
          </h2>
        </div>
        <p className="text-[9px] font-black tracking-[0.38em] text-accent/60 uppercase mb-3">
          WHERE CODE MEETS COMBAT
        </p>
        <p className="text-[11px] font-mono tracking-[0.1em] text-accent/40 leading-relaxed max-w-[340px]">
          The competitive programming arena where your algorithms fight to the death.
        </p>
        <MobileSocialIcons />
      </div>

      {ACCORDION_SECTIONS.map((section) => (
        <AccordionCard
          key={section.title}
          title={section.title}
          links={section.links}
          isOpen={openSection === section.title}
          onToggle={() => toggle(section.title)}
        />
      ))}
    </div>
  );
}
