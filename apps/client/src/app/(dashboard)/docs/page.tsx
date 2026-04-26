'use client';

import React, { useState } from 'react';
import { SAMPLE_SCRIPT, IDENTIFIER_TABLE } from './constants/docsData';
import { HeroSection } from './components/HeroSection';
import { QuickReferenceSection } from './components/QuickReferenceSection';
import { InteractivePlayground } from './components/InteractivePlayground';
import { BattleTacticsSection } from './components/BattleTacticsSection';
import { CommandReferenceSection } from './components/CommandReferenceSection';
import { RotationSystemSection } from './components/RotationSystemSection';
import { AlgorithmChallenges } from './components/AlgorithmChallenges';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { EnergyCostSection } from './components/EnergyCostSection';

const CATEGORY_COLORS: Record<string, string> = {
  Self: 'var(--accent)',
  Combat: 'var(--color-orange-500)',
  Energy: '#818cf8',
  FOV: 'var(--accent)',
  Scan: 'var(--accent)',
};

/** Inline identifier reference table */
const IdentifierReferenceSection = ({ isMobile }: { isMobile: boolean }) => {
  const categories = Array.from(new Set(IDENTIFIER_TABLE.map(id => id.category)));

  return (
    <section className={isMobile ? "mb-10" : "mb-16"}>
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
        <h2 className={`${isMobile ? "text-base" : "text-xl"} font-black tracking-[0.15em] text-text-primary uppercase text-center`}>
          Built-in Identifiers
          <span className="ml-2 text-[10px] tracking-[0.4em] text-accent/80 align-middle">v2.0</span>
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
      </div>

      <div className={`flex flex-col ${isMobile ? "gap-6" : "gap-8"}`}>
        {categories.map(cat => (
          <div key={cat}>
            <div
              className="text-[10px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b border-accent/20 text-accent"
              style={{
                color: String(CATEGORY_COLORS[cat] || 'var(--accent)'),
                borderColor: `rgba(var(--accent-rgb), 0.2)`,
              }}
            >
              {cat}
            </div>
            <div className="flex flex-col gap-1">
              {IDENTIFIER_TABLE.filter(id => id.category === cat).map(id => (
                <div
                  key={id.name}
                  className={`${isMobile ? "flex flex-col gap-1 p-3" : "grid grid-cols-[140px_60px_1fr] gap-4 items-start px-4 py-2.5"} rounded-xl border border-accent/10 bg-card/40 transition-colors hover:border-accent/40 hover:bg-accent/[0.05]`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <code
                      className={`${isMobile ? "text-xs" : "text-xs"} font-black tracking-wider`}
                      style={{ color: String(CATEGORY_COLORS[cat] || 'var(--accent)') }}
                    >
                      {id.name}
                    </code>
                    <span className="text-[10px] text-text-secondary/50 font-mono tracking-tighter">{id.type}</span>
                  </div>
                  <span className={`${isMobile ? "text-[10px]" : "text-[11px]"} text-text-secondary leading-relaxed opacity-80`}>
                    {id.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default function DocsPage() {
  const [script, setScript] = useState(SAMPLE_SCRIPT);
  const [parsed, setParsed] = useState<string[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleParse = () => {
    const lines = script.split('\n').map(l => l.trim()).filter(Boolean);
    setParsed(lines);
  };

  const loadCodeToPlayground = (code: string) => {
    setScript(code);
    const editor = document.getElementById('aliscript-editor');
    if (editor) {
      window.scrollTo({ top: editor.offsetTop - 100, behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(var(--accent-rgb),0.3), 0 0 24px rgba(var(--accent-rgb),0.1); }
          50%      { box-shadow: 0 0 16px rgba(var(--accent-rgb),0.6), 0 0 48px rgba(var(--accent-rgb),0.2); }
        }
        .docs-textarea {
          resize: vertical;
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          line-height: 1.7;
          padding: 16px;
          width: 100%;
          min-height: 200px;
          transition: border-color 0.2s;
          letter-spacing: 0.05em;
        }
        .docs-textarea:focus {
          border-color: rgba(var(--accent-rgb),0.5);
          box-shadow: 0 0 0 2px rgba(var(--accent-rgb),0.08), 0 0 20px rgba(var(--accent-rgb),0.1);
        }
        .docs-scrollbar::-webkit-scrollbar { width: 4px; }
        .docs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .docs-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--accent-rgb),0.2); border-radius: 2px; }
        .cmd-row:hover { background-color: rgba(var(--accent-rgb),0.03); }
        .quick-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .quick-card:hover { transform: translateY(-3px); }
      `}</style>

      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""}`}>
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className={`max-w-[1100px] mx-auto ${isMobile ? "px-4 pt-6" : "px-6 pt-12"} pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]`}>
          <HeroSection isMobile={isMobile} />

          <QuickReferenceSection isMobile={isMobile} />

          <InteractivePlayground
            script={script}
            setScript={setScript}
            parsed={parsed}
            onParse={handleParse}
            isMobile={isMobile}
          />

          {/* Algorithm Challenges */}
          <AlgorithmChallenges onLoadScript={loadCodeToPlayground} isMobile={isMobile} />

          <BattleTacticsSection onLoadScript={loadCodeToPlayground} isMobile={isMobile} />

          <CommandReferenceSection isMobile={isMobile} />

          {/* Rotation System Guide */}
          <RotationSystemSection onLoadScript={loadCodeToPlayground} isMobile={isMobile} />

          {/* Built-in Identifiers reference */}
          <IdentifierReferenceSection isMobile={isMobile} />

          {/* Energy cost breakdown + simulator */}
          <EnergyCostSection isMobile={isMobile} />
        </div>
      </div>
    </>
  );
}
