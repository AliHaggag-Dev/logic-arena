import React from 'react';
import { QUERY_TABLE } from '../constants/docsData';
import { SectionLabel } from './SectionLabel';

export const QueryFunctionsSection = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <section className={isMobile ? "mb-10" : "mb-16"}>
      <SectionLabel text="QUERY FUNCTIONS" isMobile={isMobile} />

      <div className="grid grid-cols-1 gap-4">
        {QUERY_TABLE.map(q => (
          <div
            key={q.command}
            className={`${isMobile ? "p-3" : "p-4"} rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/[0.02] hover:bg-[#06b6d4]/[0.05] transition-colors`}
          >
            <div className="flex justify-between items-center mb-2">
              <code className="text-[#06b6d4] font-black tracking-wide text-sm">{q.command}</code>
              <span className="text-[10px] uppercase tracking-widest text-[#06b6d4]/60 bg-[#06b6d4]/10 px-2 py-0.5 rounded-full">
                Returns: {q.returns}
              </span>
            </div>
            <p className="text-xs text-text-secondary/80 leading-relaxed">
              {q.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
