'use client';

import React, { useState } from 'react';
import { SAMPLE_SCRIPT } from './constants/docsData';
import { HeroSection } from './components/HeroSection';
import { QuickReferenceSection } from './components/QuickReferenceSection';
import { InteractivePlayground } from './components/InteractivePlayground';
import { BattleTacticsSection } from './components/BattleTacticsSection';
import { CommandReferenceSection } from './components/CommandReferenceSection';
import { RotationSystemSection } from './components/RotationSystemSection';
import { AlgorithmChallenges } from './components/AlgorithmChallenges';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { EnergyCostSection } from './components/EnergyCostSection';
import { QueryFunctionsSection } from './components/QueryFunctionsSection';
import { IdentifierReferenceSection } from './components/IdentifierReferenceSection';
import './docs.css';

export default function DocsPage() {
  const [script, setScript] = useState(SAMPLE_SCRIPT);
  const [parsed, setParsed] = useState<string[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleParse = () => {
    const lines = script.split('\n').map(l => l.trim()).filter(Boolean);
    setParsed(lines);
  };

  const loadCodeToPlayground = (code: string) => {
    setScript(code);
    const editor = document.getElementById('aliscript-editor');
    if (editor) {
      const SCROLL_OFFSET = 100;
      window.scrollTo({ top: editor.offsetTop - SCROLL_OFFSET, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${
        isMobile ? 'pb-[env(safe-area-inset-bottom)]' : ''
      }`}
    >
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div
        className={`max-w-[1100px] mx-auto ${
          isMobile ? 'px-4 pt-6' : 'px-6 pt-12'
        } pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]`}
      >
        <HeroSection isMobile={isMobile} />

        <QuickReferenceSection isMobile={isMobile} />

        <CommandReferenceSection isMobile={isMobile} />

        <QueryFunctionsSection isMobile={isMobile} />

        <IdentifierReferenceSection isMobile={isMobile} />

        <EnergyCostSection isMobile={isMobile} />

        <RotationSystemSection onLoadScript={loadCodeToPlayground} isMobile={isMobile} />

        <AlgorithmChallenges onLoadScript={loadCodeToPlayground} isMobile={isMobile} />

        <BattleTacticsSection onLoadScript={loadCodeToPlayground} isMobile={isMobile} />

        <InteractivePlayground
          script={script}
          setScript={setScript}
          parsed={parsed}
          onParse={handleParse}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
