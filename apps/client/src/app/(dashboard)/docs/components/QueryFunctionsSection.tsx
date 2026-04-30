import React from 'react';
import { QUERY_TABLE } from '../constants/docsData';
import { SectionLabel } from './SectionLabel';

export const QueryFunctionsSection = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <section className={isMobile ? 'mb-10' : 'mb-16'}>
      <SectionLabel text="QUERY FUNCTIONS" isMobile={isMobile} />
      <p className="text-[10px] text-text-secondary/50 mt-3 mb-5 leading-relaxed tracking-wide font-medium">
        Query functions print live robot state to the status log panel during a match.
        They do <strong className="text-text-secondary/70">not</strong> return values — use built-in identifiers
        (e.g. <code className="text-cyan-400 text-[10px]">MY_ENERGY</code>, <code className="text-cyan-400 text-[10px]">health</code>) for conditional logic instead.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {QUERY_TABLE.map(q => (
          <div
            key={q.command}
            className={`${isMobile ? 'p-3' : 'p-4'} rounded-xl border border-cyan-500/20 bg-cyan-500/[0.02] hover:bg-cyan-500/[0.05] transition-colors`}
          >
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} mb-2`}>
              <code className="text-cyan-400 font-black tracking-wide text-sm">{q.command}</code>
              <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 bg-cyan-400/10 px-2 py-0.5 rounded-full w-fit">
                → {q.returns}
              </span>
            </div>
            <p className="text-xs text-text-secondary/80 leading-relaxed">{q.description}</p>
            <div className="mt-2 text-[10px] font-mono text-cyan-400/40">
              <span className="text-text-secondary/30 mr-2">e.g.</span>
              <code>{q.example}</code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
