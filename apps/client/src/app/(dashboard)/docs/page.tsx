'use client';

import React, { useState } from 'react';
import { SAMPLE_SCRIPT, IDENTIFIER_TABLE } from './constants/docsData';
import { HeroSection } from './components/HeroSection';
import { QuickReferenceSection } from './components/QuickReferenceSection';
import { InteractivePlayground } from './components/InteractivePlayground';
import { BattleTacticsSection } from './components/BattleTacticsSection';
import { CommandReferenceSection } from './components/CommandReferenceSection';
import { AlgorithmChallenges } from './components/AlgorithmChallenges';

const CATEGORY_COLORS: Record<string, string> = {
  Self:      '#22d3ee',
  Combat:    '#f97316',
  Energy:    '#818cf8',
  FOV:       '#06b6d4',
  Scan:      '#67e8f9',
};

/** Inline identifier reference table — added directly in page so it can
 *  share the existing section style without a separate component file. */
const IdentifierReferenceSection = () => {
  const categories = Array.from(new Set(IDENTIFIER_TABLE.map(id => id.category)));

  return (
    <section className="mb-16">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
        <h2 className="text-xl font-black tracking-[0.15em] text-white/90 uppercase text-center">
          Built-in Identifiers
          <span className="ml-2 text-[9px] tracking-[0.4em] text-cyan-600 align-middle">v2.0</span>
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
      </div>

      <div className="flex flex-col gap-8">
        {categories.map(cat => (
          <div key={cat}>
            <div
              className="text-[9px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b"
              style={{
                color:       CATEGORY_COLORS[cat] ?? '#22d3ee',
                borderColor: `${CATEGORY_COLORS[cat] ?? '#22d3ee'}33`,
              }}
            >
              {cat}
            </div>
            <div className="flex flex-col gap-1">
              {IDENTIFIER_TABLE.filter(id => id.category === cat).map(id => (
                <div
                  key={id.name}
                  className="grid grid-cols-[140px_60px_1fr] gap-4 items-start px-4 py-2.5 rounded-sm border border-transparent transition-colors hover:border-cyan-900/40 hover:bg-white/[0.02]"
                >
                  <code
                    className="text-xs font-black tracking-wider"
                    style={{ color: CATEGORY_COLORS[cat] ?? '#22d3ee' }}
                  >
                    {id.name}
                  </code>
                  <span className="text-[10px] text-white/25 font-mono">{id.type}</span>
                  <span className="text-[11px] text-white/50 leading-relaxed">{id.description}</span>
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
          0%, 100% { box-shadow: 0 0 8px rgba(34,211,238,0.3), 0 0 24px rgba(34,211,238,0.1); }
          50%      { box-shadow: 0 0 16px rgba(34,211,238,0.6), 0 0 48px rgba(34,211,238,0.2); }
        }
        .docs-textarea {
          resize: vertical;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(34,211,238,0.2);
          border-radius: 8px;
          color: #22d3ee;
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          line-height: 1.7;
          padding: 16px;
          width: 100%;
          min-height: 200px;
          outline: none;
          transition: border-color 0.2s;
          letter-spacing: 0.05em;
        }
        .docs-textarea:focus {
          border-color: rgba(34,211,238,0.5);
          box-shadow: 0 0 0 2px rgba(34,211,238,0.08), 0 0 20px rgba(34,211,238,0.1);
        }
        .docs-scrollbar::-webkit-scrollbar { width: 4px; }
        .docs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .docs-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 2px; }
        .cmd-row:hover { background-color: rgba(34,211,238,0.03); }
        .quick-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .quick-card:hover { transform: translateY(-3px); }
      `}</style>

      <div className="min-h-screen bg-[#030712] font-mono text-[#22d3ee]/90 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(8,145,178,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.06) 1px, transparent 1px)',
            backgroundSize:  '40px 40px',
          }}
        />

        <div className="max-w-[1100px] mx-auto px-6 pt-12 pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]">
          <HeroSection />

          <QuickReferenceSection />

          <InteractivePlayground
            script={script}
            setScript={setScript}
            parsed={parsed}
            onParse={handleParse}
          />

          {/* Algorithm Challenges — new section */}
          <AlgorithmChallenges onLoadScript={loadCodeToPlayground} />

          <BattleTacticsSection onLoadScript={loadCodeToPlayground} />

          <CommandReferenceSection />

          {/* Built-in Identifiers reference — new section */}
          <IdentifierReferenceSection />
        </div>
      </div>
    </>
  );
}
