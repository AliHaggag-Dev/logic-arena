"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { BlockCategory, BlockDefinition, BlockType } from "./blockTypes";
import { BLOCK_CATEGORIES, BLOCK_DEFINITIONS } from "./blockTypes";

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
  onClose?: () => void;
}

interface PaletteBlockProps {
  definition: BlockDefinition;
  onAddBlock: (type: BlockType) => void;
}

function matchesSearch(definition: BlockDefinition, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [
    definition.label,
    definition.description,
    definition.type,
    ...(definition.searchTerms ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

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
      onClick={() => {
        onAddBlock(definition.type);
      }}
      className="flex min-h-[52px] w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition-[transform,background,border-color] duration-200 active:scale-[0.98]"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.45 : 1,
        background: "rgba(var(--arena-white-rgb),0.05)",
        border: "1px solid rgba(var(--arena-white-rgb),0.1)",
        boxShadow: "inset 0 1px 0 rgba(var(--arena-white-rgb),0.05)",
        borderLeft: `3px solid ${definition.colorVar}`,
      }}
    >
      <span
        className="w-full truncate font-mono text-[11px] font-semibold leading-tight"
        style={{ color: "var(--arena-white)" }}
      >
        {definition.label}
      </span>
      <span
        className="line-clamp-2 text-[10px] leading-snug"
        style={{ color: "rgba(var(--arena-white-rgb),0.52)" }}
      >
        {definition.description}
      </span>
    </button>
  );
}

export function BlockPalette({ onAddBlock, onClose }: BlockPaletteProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>("ACTIONS");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategoryMeta = BLOCK_CATEGORIES.find((category) => category.id === activeCategory);

  const visibleBlocks = useMemo(() => {
    if (searchQuery.trim()) {
      return BLOCK_DEFINITIONS.filter((definition) => matchesSearch(definition, searchQuery));
    }
    return BLOCK_DEFINITIONS.filter((definition) => definition.category === activeCategory);
  }, [activeCategory, searchQuery]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeCategory, searchQuery]);

  return (
    <section
      aria-label="Block library"
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl p-2 sm:gap-3 sm:p-3"
      style={{
        background: "rgba(10, 10, 15, 0.85)", // Dark premium glass background
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 24px 64px rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-0.5">
        <div>
          <h2 className="text-base font-bold text-white">Command Library</h2>
          <p className="text-[10px] hidden sm:block" style={{ color: "rgba(var(--arena-white-rgb),0.5)" }}>
            {searchQuery.trim()
              ? `${visibleBlocks.length} match${visibleBlocks.length === 1 ? "" : "es"}`
              : (activeCategoryMeta?.description ?? "Tap or drag a block into your script")}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close library"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      <div className="relative shrink-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
          style={{ color: "rgba(var(--arena-white-rgb),0.35)" }}
          aria-hidden="true"
        />
        <input
          type="text"
          aria-label="Search commands"
          placeholder="Search commands... e.g. GET_HEALTH, FIRE, WHILE"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-10 w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-[border-color,box-shadow] duration-200"
          spellCheck={false}
          style={{
            color: "var(--arena-white)",
            background: "rgba(var(--arena-white-rgb),0.05)",
            border: "1px solid rgba(var(--arena-white-rgb),0.1)",
          }}
        />
      </div>

      {!searchQuery.trim() && (
        <div 
          className="flex shrink-0 gap-1.5 overflow-x-auto pb-2 scrollbar-hide overscroll-x-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {BLOCK_CATEGORIES.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={isActive}
                title={category.description}
                className="flex shrink-0 items-center justify-center min-h-8 sm:min-h-10 px-3 sm:px-4 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-300"
                style={{
                  color: isActive ? "var(--arena-bg-dark)" : "rgba(var(--arena-white-rgb), 0.7)",
                  background: isActive ? category.colorVar : "rgba(var(--arena-white-rgb),0.06)",
                  border: `1px solid ${isActive ? "transparent" : "rgba(var(--arena-white-rgb),0.08)"}`,
                  boxShadow: isActive ? `0 4px 16px ${category.colorVar}40` : "none",
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        <div ref={scrollRef} className="grid h-full w-full grid-cols-2 content-start gap-1.5 overflow-y-auto overscroll-contain px-0.5 pt-1">
          {visibleBlocks.length === 0 ? (
            <p
              className="col-span-2 rounded-xl px-3 py-6 text-center text-[11px]"
              style={{
                color: "rgba(var(--arena-white-rgb),0.45)",
                border: "1px dashed rgba(var(--arena-white-rgb),0.14)",
                background: "rgba(var(--arena-white-rgb),0.03)",
              }}
            >
              No commands match your search. Try GET, FIRE, or IF.
            </p>
          ) : (
            visibleBlocks.map((definition) => (
              <PaletteBlock
                key={`${definition.category}-${definition.type}-${definition.label}`}
                definition={definition}
                onAddBlock={onAddBlock}
              />
            ))
          )}
          {/* Spacer for bottom scroll */}
          {visibleBlocks.length > 0 && <div className="col-span-2 h-8" />}
        </div>
      </div>
    </section>
  );
}
