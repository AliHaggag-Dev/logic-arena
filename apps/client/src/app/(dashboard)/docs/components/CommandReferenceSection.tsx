import React, { useState, useMemo } from "react";
import { SectionLabel } from "./SectionLabel";
import { COMMAND_TABLE, CATEGORY_COLORS } from "../constants/docsData";

interface FilterChipProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

function FilterChip({ label, active, color, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: '4px',
        backgroundColor: active ? `color-mix(in srgb, ${color} 9%, transparent)` : 'transparent',
        border: active
          ? `1px solid color-mix(in srgb, ${color} 33%, transparent)`
          : `1px solid rgba(var(--accent-rgb),0.12)`,
        color: active ? color : `rgba(var(--accent-rgb),0.35)`,
        textShadow: active ? `0 0 8px color-mix(in srgb, ${color} 40%, transparent)` : 'none',
        transition: 'all 0.15s',
      }}
      className="text-[9px] font-bold tracking-[0.2em] cursor-pointer font-mono hover:opacity-80 shrink-0"
    >
      {label}
    </button>
  );
}

export function CommandReferenceSection({ isMobile }: { isMobile: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedCmd, setExpandedCmd] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(COMMAND_TABLE.map((c) => c.category))),
    [],
  );

  const filteredCommands = useMemo(
    () =>
      activeCategory
        ? COMMAND_TABLE.filter((c) => c.category === activeCategory)
        : COMMAND_TABLE,
    [activeCategory],
  );

  if (isMobile) {
    return (
      <section className="mb-10">
        <SectionLabel text="COMMAND REFERENCE" isMobile={true} />

        {/* Filter row */}
        <div className="flex gap-2 overflow-x-auto docs-scrollbar mt-4 pb-2 -mx-1 px-1">
          <FilterChip
            label="ALL"
            active={activeCategory === null}
            color="var(--accent)"
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat.toUpperCase()}
              active={activeCategory === cat}
              color={CATEGORY_COLORS[cat] ?? 'var(--accent)'}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            />
          ))}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 mt-4">
          {filteredCommands.map((cmd, idx) => {
            const catColor = CATEGORY_COLORS[cmd.category] ?? 'var(--accent)';
            const key = `${cmd.command}-${idx}`;
            const isExpanded = expandedCmd === key;

            return (
              <div
                key={key}
                className={`bg-card/60 border border-accent/10 rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-1 ring-accent/20' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedCmd(isExpanded ? null : key)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <code className="text-accent font-black bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg text-[11px]">
                      {cmd.command}
                    </code>
                    <span
                      className="text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${catColor} 7%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${catColor} 19%, transparent)`,
                        color: catColor,
                      }}
                    >
                      {cmd.category}
                    </span>
                  </div>
                  <span className={`text-[10px] text-accent/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-accent/5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Energy Cost</div>
                        <span
                          className="text-[10px] font-black"
                          style={{ color: catColor }}
                        >
                          {cmd.energyCost ?? 'Free'}
                        </span>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Parameters</div>
                        <code className="text-[10px] text-accent/60 font-mono italic">{cmd.parameters || 'NONE'}</code>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Description</div>
                        <p className="text-[10px] text-text-primary/70 leading-relaxed font-medium">{cmd.description}</p>
                      </div>
                      <div className="bg-bg-primary/40 rounded-lg p-3 border border-accent/5">
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Example</div>
                        <code className="text-[10px] text-accent font-bold">{cmd.example}</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[9px] text-accent/20 tracking-[0.2em] text-right font-bold">
          {filteredCommands.length} / {COMMAND_TABLE.length} COMMANDS LISTED
        </div>
      </section>
    );
  }

  return (
    <section className="mb-[60px]">
      <SectionLabel text="COMMAND REFERENCE" />

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mt-5 mb-4">
        <FilterChip
          label="ALL"
          active={activeCategory === null}
          color="var(--accent)"
          onClick={() => setActiveCategory(null)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            label={cat.toUpperCase()}
            active={activeCategory === cat}
            color={CATEGORY_COLORS[cat] ?? 'var(--accent)'}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
          />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-accent/10 overflow-hidden bg-card/60 backdrop-blur-md" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px] tracking-[0.08em]">
            <thead>
              <tr className="border-b border-accent/10 bg-accent/5">
                {['Command', 'Category', 'Energy', 'Parameters', 'Description', 'Example'].map((h) => (
                  <th
                    key={h}
                    className="px-[18px] py-[14px] text-left text-[9px] font-bold tracking-[0.25em] text-accent/35 uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCommands.map((cmd, idx) => {
                const catColor = CATEGORY_COLORS[cmd.category] ?? 'var(--accent)';
                return (
                  <tr
                    key={`${cmd.command}-${idx}`}
                    className="cmd-row hover:bg-accent/5 transition-colors duration-150"
                    style={{
                      borderBottom: idx < filteredCommands.length - 1 ? '1px solid rgba(var(--accent-rgb),0.05)' : 'none',
                    }}
                  >
                    <td className="px-[18px] py-[14px]">
                      <code className="text-accent font-bold bg-accent/5 border border-accent/15 px-2 py-1 rounded text-[10px] whitespace-nowrap">
                        {cmd.command}
                      </code>
                    </td>
                    <td className="px-[18px] py-[14px]">
                      <span
                        className="inline-block px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.15em] whitespace-nowrap"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${catColor} 7%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${catColor} 19%, transparent)`,
                          color: catColor,
                        }}
                      >
                        {cmd.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-[18px] py-[14px] whitespace-nowrap">
                      <span
                        className="text-[10px] font-black"
                        style={{ color: catColor }}
                      >
                        {cmd.energyCost ?? 'Free'}
                      </span>
                    </td>
                    <td className="px-[18px] py-[14px] text-accent/35 text-[10px] whitespace-nowrap">
                      {cmd.parameters}
                    </td>
                    <td className="px-[18px] py-[14px] text-accent/60 leading-relaxed min-w-[240px]">
                      {cmd.description}
                    </td>
                    <td className="px-[18px] py-[14px]">
                      <code className="text-accent/50 text-[10px] whitespace-nowrap">
                        {cmd.example}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-[9px] text-accent/20 tracking-[0.18em] text-right">
        {filteredCommands.length} / {COMMAND_TABLE.length} COMMANDS DISPLAYED
      </div>
    </section>
  );
}
