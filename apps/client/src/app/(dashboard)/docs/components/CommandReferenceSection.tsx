import React, { useState } from "react";
import { SectionLabel } from "./SectionLabel";
import { COMMAND_TABLE, CATEGORY_COLORS } from "../constants/docsData";

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "5px 14px",
        borderRadius: "4px",
        backgroundColor: active ? `${color}18` : hovered ? `${color}0d` : "transparent",
        border: active
          ? `1px solid ${color}55`
          : hovered
            ? `1px solid ${color}35`
            : `1px solid rgba(var(--accent-rgb),0.12)`,
        color: active ? color : hovered ? `${color}bb` : "rgba(var(--accent-rgb),0.35)",
        textShadow: active ? `0 0 8px ${color}66` : "none",
      }}
      className="text-[9px] font-bold tracking-[0.2em] cursor-pointer transition-all duration-150 font-mono"
    >
      {label}
    </button>
  );
}

export function CommandReferenceSection({ isMobile }: { isMobile: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedCmd, setExpandedCmd] = useState<string | null>(null);

  const filteredCommands = activeCategory
    ? COMMAND_TABLE.filter((c) => c.category === activeCategory)
    : COMMAND_TABLE;

  const categories = Array.from(new Set(COMMAND_TABLE.map((c) => c.category)));

  if (isMobile) {
    return (
      <section className="mb-10">
        <SectionLabel text="COMMAND_REFERENCE" isMobile={true} />

        {/* Categories Mobile (Scrollable Row) */}
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
              color={CATEGORY_COLORS[cat] ?? "var(--accent)"}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            />
          ))}
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col gap-3 mt-4">
          {filteredCommands.map((cmd, idx) => {
            const catColor = CATEGORY_COLORS[cmd.category] ?? "var(--accent)";
            const isExpanded = expandedCmd === `${cmd.command}-${idx}`;

            return (
              <div
                key={`${cmd.command}-${idx}`}
                className={`bg-card/60 border border-accent/10 rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? "ring-1 ring-accent/20" : ""}`}
              >
                <button
                  onClick={() => setExpandedCmd(isExpanded ? null : `${cmd.command}-${idx}`)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <code className="text-accent font-black bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg text-[11px] shadow-[0_2px_8px_rgba(var(--accent-rgb),0.1)]">
                      {cmd.command}
                    </code>
                    <span
                      className="text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: `${catColor}12`,
                        border: `1px solid ${catColor}30`,
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
                    <div className="mt-3 space-y-4">
                      <div>
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1.5">Parameters_</div>
                        <code className="text-[10px] text-accent/60 font-mono italic">{cmd.parameters || 'NONE'}</code>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1.5">Logic_Mapping_</div>
                        <p className="text-[10px] text-text-primary/70 leading-relaxed font-medium">{cmd.description}</p>
                      </div>
                      <div className="bg-bg-primary/40 rounded-lg p-3 border border-accent/5 shadow-inner">
                        <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1.5">Syntax_Pattern_</div>
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
          {filteredCommands.length} / {COMMAND_TABLE.length} COMMANDS_LISTED
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionLabel text="COMMAND_REFERENCE" />

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
            color={CATEGORY_COLORS[cat] ?? "var(--accent)"}
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
                {["Command", "Category", "Parameters", "Description", "Example"].map((h) => (
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
                const catColor = CATEGORY_COLORS[cmd.category] ?? "var(--accent)";
                return (
                  <tr
                    key={`${cmd.command}-${idx}`}
                    className="cmd-row hover:bg-accent/5 transition-colors duration-150"
                    style={{
                      borderBottom: idx < filteredCommands.length - 1 ? "1px solid rgba(var(--accent-rgb),0.05)" : "none",
                    }}
                  >
                    {/* Command */}
                    <td className="px-[18px] py-[14px]">
                      <code className="text-accent font-bold bg-accent/5 border border-accent/15 px-2 py-1 rounded text-[10px] whitespace-nowrap">
                        {cmd.command}
                      </code>
                    </td>

                    {/* Category */}
                    <td className="px-[18px] py-[14px]">
                      <span
                        className="inline-block px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.15em] whitespace-nowrap"
                        style={{
                          backgroundColor: `${catColor}12`,
                          border: `1px solid ${catColor}30`,
                          color: catColor,
                        }}
                      >
                        {cmd.category.toUpperCase()}
                      </span>
                    </td>

                    {/* Parameters */}
                    <td className="px-[18px] py-[14px] text-accent/35 text-[10px] whitespace-nowrap">
                      {cmd.parameters}
                    </td>

                    {/* Description */}
                    <td className="px-[18px] py-[14px] text-accent/60 leading-relaxed min-w-[250px]">
                      {cmd.description}
                    </td>

                    {/* Example */}
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
