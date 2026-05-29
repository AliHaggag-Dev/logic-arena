import React from 'react';
import {
  MATH_STDLIB_TABLE,
  ARRAY_OPS_TABLE,
  DICTIONARY_OPS_TABLE,
  SENSOR_FUNCTIONS_TABLE,
  SWARM_FUNCTIONS_TABLE,
  type ArrayOpDoc,
  type DictionaryOpDoc,
  type MathFunctionDoc,
  type SensorFunctionDoc,
  type SwarmFunctionDoc,
} from '../constants/docsData';
import { SectionLabel } from './SectionLabel';
import { CopyButton } from './CopyButton';

type SimpleLanguageFeatureDoc = MathFunctionDoc | ArrayOpDoc | DictionaryOpDoc;
type AdvancedLanguageFeatureDoc = SensorFunctionDoc | SwarmFunctionDoc;

export const AdvancedLanguageFeaturesSection = ({ isMobile }: { isMobile: boolean }) => {
  const renderSimpleTable = (data: SimpleLanguageFeatureDoc[], colorCode: string, title: string) => (
    <div className="mb-8">
      <div
        className="text-[10px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b border-accent/20"
        style={{ color: colorCode, borderColor: `color-mix(in srgb, ${colorCode} 20%, transparent)` }}
      >
        {title}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {data.map(item => (
          <div
            key={item.signature}
            className={`${isMobile ? 'p-3' : 'p-4'} rounded-xl border hover:bg-accent/[0.02] transition-colors`}
            style={{ borderColor: `color-mix(in srgb, ${colorCode} 13%, transparent)`, backgroundColor: `color-mix(in srgb, ${colorCode} 2%, transparent)` }}
          >
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} mb-2`}>
              <code className="font-black tracking-wide text-sm" style={{ color: colorCode }}>{item.signature}</code>
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full w-fit"
                style={{ color: `color-mix(in srgb, ${colorCode} 90%, transparent)`, backgroundColor: `color-mix(in srgb, ${colorCode} 15%, transparent)` }}
              >
                → {item.returns}
              </span>
            </div>
            <p className="text-xs text-text-secondary/80 leading-relaxed mb-3">{item.description}</p>
            <div className="text-[10px] font-mono" style={{ color: `color-mix(in srgb, ${colorCode} 70%, transparent)` }}>
              <span className="text-text-secondary/30 mr-2">e.g.</span>
              <code>{item.example}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdvancedTable = (data: AdvancedLanguageFeatureDoc[], colorCode: string, title: string) => (
    <div className="mb-8">
      <div
        className="text-[10px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b border-accent/20"
        style={{ color: colorCode, borderColor: `color-mix(in srgb, ${colorCode} 20%, transparent)` }}
      >
        {title}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {data.map(item => (
          <div
            key={item.signature}
            className="rounded-xl border border-accent/10 bg-card/60 overflow-hidden"
            style={{ borderColor: `color-mix(in srgb, ${colorCode} 19%, transparent)` }}
          >
            <div className={`flex ${isMobile ? 'flex-col items-start' : 'items-center'} gap-3 p-4 border-b border-accent/5`} style={{ backgroundColor: `color-mix(in srgb, ${colorCode} 4%, transparent)` }}>
              <code className="font-black tracking-wide text-sm" style={{ color: colorCode }}>{item.signature}</code>
              <span
                className="text-[9px] font-bold tracking-[0.2em] px-2 py-0.5 rounded-full uppercase"
                style={{ color: colorCode, border: `1px solid color-mix(in srgb, ${colorCode} 25%, transparent)` }}
              >
                {item.category}
              </span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-text-secondary/90 leading-relaxed">{item.description}</p>

              <div className="flex flex-col gap-1.5">
                <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase">Returns</div>
                <div className="text-xs font-mono text-accent/70">{item.returns}</div>
                <div className="text-[10px] text-accent/50 italic">{item.returnDetail}</div>
              </div>

              <div className="bg-bg-primary/40 rounded-lg p-3 border border-accent/5 relative">
                <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-2">Implementation Example</div>
                <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed" style={{ color: colorCode }}>
                  {item.example.split('\n').map((line: string, i: number) => {
                    const isComment = line.trimStart().startsWith('//');
                    return (
                      <div key={i} style={{ color: isComment ? 'rgba(var(--accent-rgb), 0.4)' : undefined }}>
                        {line}
                      </div>
                    );
                  })}
                </pre>
                <CopyButton code={item.example} themeColor={colorCode} />
              </div>

              {item.note && (
                <div className="text-[10px] text-accent/60 flex gap-2">
                  <span className="font-bold tracking-widest uppercase">Note:</span>
                  <span>{item.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className={isMobile ? 'mb-10' : 'mb-16'}>
      <SectionLabel text="ADVANCED LANGUAGE FEATURES" isMobile={isMobile} />

      <p className="text-[10px] text-text-secondary/50 mt-3 mb-6 leading-relaxed tracking-wide font-medium">
        AliScript has evolved into a fully-fledged deterministic language.
        Leverage these powerful data structures and APIs, but beware of the 2,000 instruction-per-tick
        quota. <strong className="text-text-secondary/70">O(N)</strong> complexity is required for array traversals!
      </p>

      {renderSimpleTable(MATH_STDLIB_TABLE, 'var(--docs-orange)', 'Math Standard Library')}
      {renderSimpleTable(ARRAY_OPS_TABLE, 'var(--docs-indigo)', 'Array Operations (O(1) / O(N))')}
      {renderSimpleTable(DICTIONARY_OPS_TABLE, 'var(--docs-rose)', 'Dictionary Hash Maps (O(1))')}
      {renderAdvancedTable(SENSOR_FUNCTIONS_TABLE, 'var(--docs-pink)', 'Advanced Sensor Arrays')}
      {renderAdvancedTable(SWARM_FUNCTIONS_TABLE, 'var(--docs-emerald)', 'Swarm Intelligence')}

    </section>
  );
};
