"use client";

import React, { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { BlockCategory, BlockDefinition, BlockType } from "./blockTypes";
import { BLOCK_CATEGORIES, BLOCK_DEFINITIONS } from "./blockTypes";

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

interface PaletteBlockProps {
  definition: BlockDefinition;
  onAddBlock: (type: BlockType) => void;
}

const PALETTE_BLOCK_MIN_HEIGHT_PX = 48;

function PaletteBlock({ definition, onAddBlock }: PaletteBlockProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${definition.type}`,
    data: { blockType: definition.type },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onAddBlock(definition.type)}
      className="shrink-0 rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.12em] transition-transform"
      style={{
        minHeight: PALETTE_BLOCK_MIN_HEIGHT_PX,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        color: "var(--arena-bg-dark)",
        background: definition.colorVar,
        border: "1px solid rgba(var(--arena-white-rgb),0.28)",
        boxShadow: "0 8px 20px rgba(var(--arena-black-rgb),0.22), inset 0 1px 0 rgba(var(--arena-white-rgb),0.25)",
      }}
    >
      {definition.label}
    </button>
  );
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>("ACTIONS");
  const activeBlocks = useMemo(
    () => BLOCK_DEFINITIONS.filter((definition) => definition.category === activeCategory),
    [activeCategory],
  );

  return (
    <div
      className="flex shrink-0 flex-col gap-2 rounded-3xl p-2 backdrop-blur-2xl"
      style={{
        background: "rgba(var(--arena-white-rgb),0.075)",
        border: "1px solid rgba(var(--arena-white-rgb),0.12)",
        boxShadow: "inset 0 1px 0 rgba(var(--arena-white-rgb),0.08)",
      }}
    >
      <div className="grid grid-cols-5 gap-1">
        {BLOCK_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategory;
          return (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className="min-h-11 min-w-0 rounded-2xl px-2 text-[9px] font-black uppercase tracking-[0.08em]"
              style={{
                color: isActive ? "var(--arena-bg-dark)" : category.colorVar,
                background: isActive ? category.colorVar : "rgba(var(--arena-black-rgb),0.32)",
                border: `1px solid ${isActive ? "rgba(var(--arena-white-rgb),0.32)" : category.colorVar}`,
                boxShadow: isActive ? "0 8px 18px rgba(var(--arena-black-rgb),0.22), inset 0 1px 0 rgba(var(--arena-white-rgb),0.28)" : "none",
              }}
            >
              {category.label}
            </button>
          );
        })}
      </div>
      <div className="flex max-h-14 gap-2 overflow-x-auto pb-1">
        {activeBlocks.map((definition) => (
          <PaletteBlock key={definition.type} definition={definition} onAddBlock={onAddBlock} />
        ))}
      </div>
    </div>
  );
}
