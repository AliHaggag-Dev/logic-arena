'use client';

import React, { useState } from 'react';
import { ALGORITHM_CHALLENGES, AlgorithmChallenge } from '../constants/docsData';

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER:     '#22d3ee',
  INTERMEDIATE: '#a855f7',
  ADVANCED:     '#f97316',
};

interface AlgorithmChallengesProps {
  onLoadScript: (code: string) => void;
}

const ChallengeCard = ({
  challenge,
  onLoadScript,
  isExpanded,
  onToggle,
}: {
  challenge:    AlgorithmChallenge;
  onLoadScript: (code: string) => void;
  isExpanded:   boolean;
  onToggle:     () => void;
}) => {
  const diffColor = DIFFICULTY_COLORS[challenge.difficulty] ?? '#22d3ee';

  return (
    <div
      className="border bg-black/40 backdrop-blur-sm transition-all duration-300 rounded-sm overflow-hidden"
      style={{
        borderColor:    isExpanded ? `${challenge.color}66` : 'rgba(34,211,238,0.12)',
        boxShadow:      isExpanded ? `0 0 20px ${challenge.color}22` : 'none',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={challenge.title}>
            {challenge.badge}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="text-sm font-black tracking-[0.1em] uppercase"
                style={{ color: challenge.color }}
              >
                {challenge.title}
              </h3>
              <span
                className="text-[8px] font-bold tracking-[0.2em] px-1.5 py-0.5 border"
                style={{ color: diffColor, borderColor: `${diffColor}44`, background: `${diffColor}0d` }}
              >
                {challenge.difficulty}
              </span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5 tracking-wider">{challenge.concept}</p>
          </div>
        </div>
        <span
          className="text-xs font-bold tracking-widest transition-transform duration-300"
          style={{
            color:     'rgba(34,211,238,0.5)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Expandable body */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          <p className="text-[11px] text-white/50 mt-4 mb-4 leading-relaxed tracking-wide">
            {challenge.description}
          </p>

          {/* Code block */}
          <div className="relative">
            <div
              className="absolute inset-0 opacity-5 rounded-sm pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${challenge.color}, transparent)` }}
            />
            <pre
              className="text-[11px] leading-relaxed p-4 rounded-sm overflow-x-auto font-mono"
              style={{
                color:      '#a5f3fc',
                background: 'rgba(0,0,0,0.6)',
                border:     '1px solid rgba(34,211,238,0.1)',
              }}
            >
              {challenge.code
                .split('\n')
                .map((line, i) => {
                  // Highlight comments in dim white, keywords in color
                  const isComment = line.trimStart().startsWith('//');
                  return (
                    <div key={i}>
                      <span style={{ color: isComment ? 'rgba(255,255,255,0.2)' : undefined }}>
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
            className="mt-4 w-full py-2.5 text-[10px] font-black tracking-[0.3em] uppercase transition-all border"
            style={{
              color:       challenge.color,
              borderColor: `${challenge.color}44`,
              background:  `${challenge.color}0d`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${challenge.color}22`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${challenge.color}88`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${challenge.color}0d`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${challenge.color}44`;
            }}
          >
            ▶ LOAD TO PLAYGROUND
          </button>
        </div>
      )}
    </div>
  );
};

export const AlgorithmChallenges = ({ onLoadScript }: AlgorithmChallengesProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <section className="mb-16">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
        <div className="text-center">
          <div className="text-[9px] tracking-[0.5em] text-cyan-700 uppercase font-black mb-1">
            AliScript v2.0
          </div>
          <h2 className="text-xl font-black tracking-[0.15em] text-white/90 uppercase">
            Algorithm Challenges
          </h2>
          <p className="text-[10px] text-white/30 tracking-widest mt-1">
            Production-ready scripts demonstrating real algorithmic thinking
          </p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
      </div>

      {/* Info callout */}
      <div className="mb-6 p-4 border border-cyan-900/40 bg-cyan-950/10 rounded-sm">
        <div className="flex items-start gap-3">
          <span className="text-cyan-400 text-lg mt-0.5">⚡</span>
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] text-cyan-400 mb-1 uppercase">
              Educational Mechanic
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed tracking-wide">
              Every AliScript command costs energy. Robots that write <strong className="text-white/60">efficient algorithms</strong> (fewer commands, same damage output) achieve higher{' '}
              <strong className="text-cyan-400">EFFICIENCY_SCORE</strong> and survive longer. Study these patterns to optimise your strategy.
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
          />
        ))}
      </div>
    </section>
  );
};
