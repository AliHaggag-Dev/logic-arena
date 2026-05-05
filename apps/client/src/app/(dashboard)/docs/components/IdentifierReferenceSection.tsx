import React, { useMemo } from 'react';
import { IDENTIFIER_TABLE, CATEGORY_COLORS } from '../constants/docsData';
import { SectionLabel } from './SectionLabel';

export function IdentifierReferenceSection({ isMobile }: { isMobile: boolean }) {
  const categories = useMemo(
    () => Array.from(new Set(IDENTIFIER_TABLE.map(id => id.category))),
    [],
  );

  return (
    <section className={isMobile ? 'mb-10' : 'mb-16'}>
      <SectionLabel text="BUILT-IN IDENTIFIERS v2.5" isMobile={isMobile} />

      <div className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-8'} mt-5`}>
        {categories.map(cat => {
          const catColor = CATEGORY_COLORS[cat] ?? 'var(--accent)';
          const entries = IDENTIFIER_TABLE.filter(id => id.category === cat);

          return (
            <div key={cat}>
              <div
                className="text-[10px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b border-accent/20"
                style={{ color: catColor, borderColor: `color-mix(in srgb, ${catColor} 20%, transparent)` }}
              >
                {cat}
              </div>
              <div className="flex flex-col gap-1">
                {entries.map(id => (
                  <div
                    key={id.name}
                    className={`${
                      isMobile
                        ? 'flex flex-col gap-1 p-3'
                        : 'grid grid-cols-[200px_1fr] gap-4 items-start px-4 py-2.5'
                    } rounded-xl border border-accent/10 bg-card/40 transition-colors hover:border-accent/30 hover:bg-accent/[0.04]`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <code
                        className="text-xs font-black tracking-wider shrink-0"
                        style={{ color: catColor }}
                      >
                        {id.name}
                      </code>
                      <span className="text-[9px] text-text-secondary/40 font-mono shrink-0">
                        {id.type}
                      </span>
                    </div>
                    <span
                      className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} text-text-secondary leading-relaxed opacity-80`}
                    >
                      {id.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
