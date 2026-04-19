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

export function CommandReferenceSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCommands = activeCategory
    ? COMMAND_TABLE.filter((c) => c.category === activeCategory)
    : COMMAND_TABLE;

  const categories = Array.from(new Set(COMMAND_TABLE.map((c) => c.category)));

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
