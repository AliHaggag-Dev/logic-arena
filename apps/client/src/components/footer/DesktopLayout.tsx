import React from 'react';
import Link from 'next/link';
import { NAV_LINKS, ARENA_LINKS, SOCIAL_LINKS, LEGAL_LINKS } from './constants';
import { GitHubIcon, LinkedinIcon, PortfolioIcon } from './Icons';
import { Hexagon, ChevronRight } from 'lucide-react';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-accent">{children}</h3>
    </div>
  );
}

function FooterLink({ target, href, children }: { target?: string; href: string; children: React.ReactNode }) {
  return (
    <Link
      target={target}
      href={href}
      className="group flex items-center text-[11.5px] font-mono tracking-[0.15em] uppercase text-accent/40 hover:text-accent py-2 transition-all duration-300 w-fit"
    >
      <span className="inline-block w-0 overflow-hidden group-hover:w-3 text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.8)] transition-all duration-300 ease-out">
        <ChevronRight size={10} />
      </span>
      <span className="group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)] group-hover:translate-x-0.5 transition-all duration-300">
        {children}
      </span>
    </Link>
  );
}

function DesktopSocialIcons() {
  const icons = [
    { label: "GitHub", href: "https://github.com/Ali-Haggag7/logic-arena", el: <GitHubIcon size={18} /> },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ali-haggag7", el: <LinkedinIcon size={18} /> },
    { label: "Portfolio", href: "https://alihaggag.me", el: <PortfolioIcon size={18} /> },
  ];
  return (
    <div className="flex items-center gap-3 mt-4">
      {icons.map(({ label, href, el }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-accent/30 hover:border-accent/60 bg-bg-secondary/50 hover:bg-accent/10 text-accent/60 hover:text-accent transition-all duration-300"
          onMouseEnter={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 8px rgba(var(--accent-rgb),0.6))")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
        >
          {el}
        </a>
      ))}
    </div>
  );
}

export function DesktopLayout() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-8 py-14">
      <div className="grid grid-cols-5 gap-10">
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 border border-accent/40 rounded-lg flex items-center justify-center bg-accent/5 shadow-[0_0_12px_rgba(var(--accent-rgb),0.15)]">
              <span className="text-accent flex items-center justify-center"><Hexagon className="w-4 h-4" /></span>
            </div>
            <Link href="/dashboard">
              <h2 className="footer-brand-name text-[15px] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)] cursor-pointer select-none hover:opacity-90 transition-opacity">
                LOGIC ARENA
              </h2>
            </Link>
          </div>
          <p className="text-[9px] font-black tracking-[0.35em] text-accent/60 uppercase mb-3">
            WHERE CODE MEETS COMBAT
          </p>
          <p className="text-[11px] font-mono tracking-[0.1em] text-accent/40 leading-relaxed max-w-xs mb-2">
            Code your robot. Enter the arena. Dominate.
          </p>
          <DesktopSocialIcons />
        </div>

        <div>
          <SectionHeader>Navigate</SectionHeader>
          <div className="flex flex-col">
            {NAV_LINKS.map((l) => <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>)}
          </div>
        </div>

        <div>
          <SectionHeader>Arena</SectionHeader>
          <div className="flex flex-col">
            {ARENA_LINKS.map((l) => <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>)}
          </div>
        </div>

        <div>
          <SectionHeader>Social</SectionHeader>
          <div className="flex flex-col">
            {SOCIAL_LINKS.map((l) => <FooterLink key={l.label} target={l.target} href={l.href}>{l.label}</FooterLink>)}
          </div>
        </div>

        <div>
          <SectionHeader>Legal</SectionHeader>
          <div className="flex flex-col">
            {LEGAL_LINKS.map((l) => <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>)}
          </div>
        </div>
      </div>
    </div>
  );
}
