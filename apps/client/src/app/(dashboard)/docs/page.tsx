'use client';

import React, { useState } from 'react';
import { SAMPLE_SCRIPT } from './constants/docsData';
import { HeroSection } from './components/HeroSection';
import { QuickReferenceSection } from './components/QuickReferenceSection';
import { InteractivePlayground } from './components/InteractivePlayground';
import { BattleTacticsSection } from './components/BattleTacticsSection';
import { CommandReferenceSection } from './components/CommandReferenceSection';
import { RotationSystemSection } from './components/rotation-system/RotationSystemSection';
import { AlgorithmChallenges } from './components/AlgorithmChallenges';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { EnergyCostSection } from './components/EnergyCostSection';
import { QueryFunctionsSection } from './components/QueryFunctionsSection';
import { IdentifierReferenceSection } from './components/IdentifierReferenceSection';
import { AdvancedLanguageFeaturesSection } from './components/AdvancedLanguageFeaturesSection';
import { DocsSectionNav } from './components/DocsSectionNav';
import { AiTutor } from '@/components/AiTutor';
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

      <DocsSectionNav isMobile={isMobile} />

      <div
        className={`max-w-[1100px] mx-auto ${
          isMobile ? 'px-4 pt-[108px]' : 'px-6 pt-12'
        } pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]`}
      >
        <div id="docs-intro" style={{ scrollMarginTop: '80px' }}>
          <HeroSection isMobile={isMobile} />
        </div>

        <div id="docs-quick-ref" style={{ scrollMarginTop: '80px' }}>
          <QuickReferenceSection isMobile={isMobile} />
        </div>

        <div id="docs-commands" style={{ scrollMarginTop: '80px' }}>
          <CommandReferenceSection isMobile={isMobile} />
        </div>

        <div id="docs-queries" style={{ scrollMarginTop: '80px' }}>
          <QueryFunctionsSection isMobile={isMobile} />
        </div>

        <div id="docs-identifiers" style={{ scrollMarginTop: '80px' }}>
          <IdentifierReferenceSection isMobile={isMobile} />
        </div>

        <div id="docs-advanced" style={{ scrollMarginTop: '80px' }}>
          <AdvancedLanguageFeaturesSection isMobile={isMobile} />
        </div>

        <div id="docs-energy" style={{ scrollMarginTop: '80px' }}>
          <EnergyCostSection isMobile={isMobile} />
        </div>

        <div id="docs-rotation" style={{ scrollMarginTop: '80px' }}>
          <RotationSystemSection onLoadScript={loadCodeToPlayground} isMobile={isMobile} />
        </div>

        <div id="docs-challenges" style={{ scrollMarginTop: '80px' }}>
          <AlgorithmChallenges onLoadScript={loadCodeToPlayground} isMobile={isMobile} />
        </div>

        <div id="docs-tactics" style={{ scrollMarginTop: '80px' }}>
          <BattleTacticsSection onLoadScript={loadCodeToPlayground} isMobile={isMobile} />
        </div>

        <div id="docs-playground" style={{ scrollMarginTop: '80px' }}>
          <InteractivePlayground
            script={script}
            setScript={setScript}
            parsed={parsed}
            onParse={handleParse}
            isMobile={isMobile}
          />
        </div>
      </div>

      <AiTutor isMobile={isMobile} />
    </div>
  );
}
