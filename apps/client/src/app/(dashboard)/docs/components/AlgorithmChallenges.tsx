'use client';

import React, { useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { ALGORITHM_CHALLENGES, AlgorithmChallenge } from '../constants/docsData';
import { SectionLabel } from './SectionLabel';
import { CopyButton } from './CopyButton';

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: 'var(--docs-cyan)',
  INTERMEDIATE: 'var(--docs-purple)',
  ADVANCED: 'var(--docs-orange)',
};

interface AlgorithmChallengesProps {
  onLoadScript: (code: string) => void;
  isMobile: boolean;
}

const ChallengeCard = ({
  challenge,
  onLoadScript,
  isExpanded,
  onToggle,
  isMobile,
}: {
  challenge: AlgorithmChallenge;
  onLoadScript: (code: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) => {
  const diffColor = DIFFICULTY_COLORS[challenge.difficulty] ?? 'var(--accent)';

  return (
    <div
      className={`border bg-card/60 backdrop-blur-sm transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-accent/20' : ''}`}
      style={{
        borderColor: isExpanded ? `color-mix(in srgb, ${challenge.color} 40%, transparent)` : 'rgba(var(--accent-rgb),0.12)',
        boxShadow: isExpanded ? `0 0 20px color-mix(in srgb, ${challenge.color} 13%, transparent)` : 'none',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between ${isMobile ? 'px-4 py-4' : 'px-5 py-4'} text-left transition-colors hover:bg-text-primary/[0.02]`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`${isMobile ? 'text-xl' : 'text-2xl'} flex items-center justify-center w-10 h-10 bg-accent/5 border border-accent/15 rounded-xl`}
            role="img"
            aria-label={challenge.title}
          >
            <challenge.badge className="w-5 h-5 opacity-80" style={{ color: challenge.color }} />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3
                className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-black tracking-[0.1em] uppercase`}
                style={{ color: 'var(--docs-yellow)' }}
              >
                {challenge.title}
              </h3>
              <span
                className="text-[8px] font-bold tracking-[0.2em] px-1.5 py-0.5 border rounded-sm"
                style={{ color: diffColor, borderColor: `color-mix(in srgb, ${diffColor} 27%, transparent)`, background: `color-mix(in srgb, ${diffColor} 5%, transparent)` }}
              >
                {challenge.difficulty}
              </span>
            </div>
            <p className="text-[9px] text-text-primary/40 tracking-wider font-bold uppercase">
              {challenge.concept}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 opacity-30 text-accent ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable body */}
      {isExpanded && (
        <div className={`${isMobile ? 'px-4' : 'px-5'} pb-5 border-t border-text-primary/5 animate-in fade-in slide-in-from-top-1 duration-200`}>
          <p className="text-[11px] text-text-primary/50 mt-4 mb-4 leading-relaxed tracking-wide font-medium">
            {challenge.description}
          </p>

          {/* Code block */}
          <div
            className="relative border rounded-lg overflow-hidden flex flex-col"
            style={{ borderColor: `color-mix(in srgb, ${challenge.color} 15%, transparent)` }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 border-b z-10"
              style={{
                backgroundColor: `color-mix(in srgb, ${challenge.color} 10%, transparent)`,
                borderBottomColor: `color-mix(in srgb, ${challenge.color} 15%, transparent)`,
              }}
            >
              <span
                className="text-[9px] font-mono tracking-widest uppercase ml-1"
                style={{ color: `color-mix(in srgb, ${challenge.color} 80%, transparent)` }}
              >
                AliScript
              </span>
              <CopyButton code={challenge.code} themeColor={challenge.color} className="relative" />
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${challenge.color}, transparent)` }}
              />
              <pre
                className={`text-[10px] leading-relaxed p-4 overflow-x-auto font-mono bg-card/60 backdrop-blur-md docs-scrollbar ${isMobile ? 'max-h-[220px]' : ''}`}
                style={{ color: 'var(--accent)' }}
              >
                {challenge.code.split('\n').map((line, i) => {
                  const isComment = line.trimStart().startsWith('//');
                  return (
                    <div key={i}>
                      <span style={{ color: isComment ? 'rgba(var(--accent-rgb), 0.3)' : undefined }}>
                        {line}
                      </span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>

          {/* Load button — unified label */}
          <button
            type="button"
            onClick={() => onLoadScript(challenge.code)}
            className="mt-4 w-full py-3 text-[10px] font-black tracking-[0.3em] uppercase transition-all border rounded-lg active:scale-[0.98] hover:brightness-[1.3] hover:shadow-[0_0_15px_currentColor] cursor-pointer"
            style={{
              color: challenge.color,
              borderColor: `color-mix(in srgb, ${challenge.color} 27%, transparent)`,
              background: `color-mix(in srgb, ${challenge.color} 5%, transparent)`,
            }}
          >
            ▶ LOAD TO EDITOR
          </button>
        </div>
      )}
    </div>
  );
};

export const AlgorithmChallenges = ({ onLoadScript, isMobile }: AlgorithmChallengesProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section className={isMobile ? 'mb-10' : 'mb-16'}>
      <SectionLabel text="ALGORITHM CHALLENGES" isMobile={isMobile} />

      {/* Info callout */}
      <div className="mt-5 mb-5 p-4 border border-accent/20 bg-accent/5 rounded-xl">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-accent mt-1 shrink-0" />
          <div>
            <div className="text-[9px] font-black tracking-[0.2em] text-accent mb-1 uppercase">
              Efficiency Rule
            </div>
            <p className="text-[11px] text-text-primary/40 leading-relaxed tracking-wide font-medium">
              Every AliScript command costs energy. Write <strong className="text-text-primary/60">efficient code</strong> to maximize your Efficiency Score.
            </p>
          </div>
        </div>
      </div>

      {/* Challenge cards */}
      <div className="flex flex-col gap-3">
        {ALGORITHM_CHALLENGES.map((challenge, i) => (
          <ChallengeCard
            key={challenge.title}
            challenge={challenge}
            onLoadScript={onLoadScript}
            isExpanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(prev => (prev === i ? null : i))}
            isMobile={isMobile}
          />
        ))}
      </div>
    </section>
  );
};
