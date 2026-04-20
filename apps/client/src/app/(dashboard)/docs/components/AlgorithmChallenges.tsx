'use client';

import React, { useState } from 'react';
import { ALGORITHM_CHALLENGES, AlgorithmChallenge } from '../constants/docsData';

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: '#22d3ee',
  INTERMEDIATE: '#a855f7',
  ADVANCED: '#f97316',
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
      className={`border bg-card/60 backdrop-blur-sm transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? "ring-1 ring-accent/20" : ""}`}
      style={{
        borderColor: isExpanded ? `${challenge.color}66` : 'rgba(var(--accent-rgb),0.12)',
        boxShadow: isExpanded ? `0 0 20px ${challenge.color}22` : 'none',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between ${isMobile ? "px-4 py-4" : "px-5 py-4"} text-left transition-colors hover:bg-text-primary/[0.02]`}
      >
        <div className="flex items-center gap-3">
          <span className={isMobile ? "text-xl" : "text-2xl"} role="img" aria-label={challenge.title}>
            {challenge.badge}
          </span>
          <div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3
                  className={`${isMobile ? "text-[11px]" : "text-sm"} font-black tracking-[0.1em] uppercase`}
                  style={{ color: challenge.color }}
                >
                  {challenge.title}
                </h3>
                <span
                  className="text-[8px] font-bold tracking-[0.2em] px-1.5 py-0.5 border rounded-sm"
                  style={{ color: diffColor, borderColor: `${diffColor}44`, background: `${diffColor}0d` }}
                >
                  {challenge.difficulty}
                </span>
              </div>
              <p className="text-[9px] text-text-primary/40 tracking-wider font-bold uppercase">{challenge.concept}</p>
            </div>
          </div>
        </div>
        <span
          className="text-[10px] font-bold tracking-widest transition-transform duration-300 opacity-30"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Expandable body */}
      {isExpanded && (
        <div className={`${isMobile ? "px-4" : "px-5"} pb-5 border-t border-text-primary/5 animate-in fade-in slide-in-from-top-1 duration-200`}>
          <p className="text-[11px] text-text-primary/50 mt-4 mb-4 leading-relaxed tracking-wide font-medium">
            {challenge.description}
          </p>

          {/* Code block */}
          <div className="relative">
            <div
              className="absolute inset-0 opacity-5 rounded-lg pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${challenge.color}, transparent)` }}
            />
            <pre
              className={`text-[10px] leading-relaxed p-4 rounded-lg overflow-x-auto font-mono bg-card/60 backdrop-blur-md docs-scrollbar border border-accent/10 ${isMobile ? "max-h-[200px]" : ""}`}
              style={{
                color: 'var(--accent)',
              }}
            >
              {challenge.code
                .split('\n')
                .map((line, i) => {
                  // Highlight comments in dim text-primary, keywords in color
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

          {/* Load button */}
          <button
            type="button"
            onClick={() => onLoadScript(challenge.code)}
            className="mt-4 w-full py-3 text-[10px] font-black tracking-[0.3em] uppercase transition-all border rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.2)] active:scale-[0.98]"
            style={{
              color: challenge.color,
              borderColor: `${challenge.color}44`,
              background: `${challenge.color}0d`,
            }}
          >
            ▶ LOAD_TO_CORE
          </button>
        </div>
      )}
    </div>
  );
};

export const AlgorithmChallenges = ({ onLoadScript, isMobile }: AlgorithmChallengesProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <section className={isMobile ? "mb-10" : "mb-16"}>
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
        <div className="text-center">
          <div className="text-[9px] tracking-[0.4em] text-accent/60 uppercase font-black mb-1">
            Core_Logic_Library
          </div>
          <h2 className={`${isMobile ? "text-base" : "text-xl"} font-black tracking-[0.15em] text-text-primary/90 uppercase`}>
            Algorithm Challenges
          </h2>
          {!isMobile && (
            <p className="text-[10px] text-text-primary/30 tracking-widest mt-1 uppercase font-bold">
              Production-ready scripts for neural expansion
            </p>
          )}
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
      </div>

      {/* Info callout */}
      <div className="mb-6 p-4 border border-accent/20 bg-accent/5 rounded-xl shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.02)]">
        <div className="flex items-start gap-3">
          <span className="text-accent text-lg mt-0.5">⚡</span>
          <div>
            <div className="text-[9px] font-black tracking-[0.2em] text-accent mb-1 uppercase">
              Efficiency_Protocol
            </div>
            <p className="text-[11px] text-text-primary/40 leading-relaxed tracking-wide font-medium">
              Every AliScript command costs energy. Write <strong className="text-text-primary/60">efficient algorithms</strong> to maximize your SURVIVAL_SCORE.
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
