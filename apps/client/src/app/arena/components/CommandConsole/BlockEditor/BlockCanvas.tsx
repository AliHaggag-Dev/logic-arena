"use client";

import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Block, type BlockSlot } from "./Block";
import type { BlockNode, BlockType } from "./blockTypes";

interface BlockCanvasProps {
  blocks: BlockNode[];
  containerId?: string;
  emptyLabel?: string;
  depth?: number;
  onInputChange: (blockId: string, key: string, value: string | number) => void;
  onAddChild: (parentId: string, slot: BlockSlot, type: BlockType) => void;
  onDelete: (blockId: string) => void;
}

const ROOT_CANVAS_MIN_HEIGHT_PX = 104;
const NESTED_CANVAS_MIN_HEIGHT_PX = 58;

export function BlockCanvas({
  blocks,
  containerId = "root",
  emptyLabel = "Tap a block below or drag it here",
  depth = 0,
  onInputChange,
  onAddChild,
  onDelete,
}: BlockCanvasProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id: containerId });
  const blockIds = blocks.map((block) => block.id);
  const isRoot = depth === 0;

  return (
    <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex min-w-0 flex-col gap-2 rounded-2xl p-2 ${isRoot ? "flex-1 overflow-y-auto" : "shrink-0 overflow-visible"}`}
        style={{
          minHeight: isRoot ? ROOT_CANVAS_MIN_HEIGHT_PX : NESTED_CANVAS_MIN_HEIGHT_PX,
          background: isOver ? "rgba(var(--arena-cyan-rgb),0.12)" : "rgba(var(--arena-white-rgb),0.055)",
          border: isOver ? "1px solid var(--arena-cyan)" : "1px solid rgba(var(--arena-white-rgb),0.12)",
          boxShadow: isRoot ? "inset 0 1px 0 rgba(var(--arena-white-rgb),0.08)" : "none",
        }}
      >
        {blocks.length === 0 ? (
          <div className="flex min-h-14 items-center justify-center rounded-xl px-4 text-center text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "rgba(var(--arena-white-rgb),0.45)", border: "1px dashed rgba(var(--arena-white-rgb),0.18)" }}>
            {emptyLabel}
          </div>
        ) : (
          blocks.map((block) => (
            <Block
              key={block.id}
              block={block}
              onInputChange={onInputChange}
              onAddChild={onAddChild}
              onDelete={onDelete}
              childContent={
                <BlockCanvas
                  blocks={block.children ?? []}
                  containerId={`${block.id}:children`}
                  emptyLabel="Drop inner blocks"
                  depth={depth + 1}
                  onInputChange={onInputChange}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                />
              }
              elseContent={
                <BlockCanvas
                  blocks={block.elseChildren ?? []}
                  containerId={`${block.id}:elseChildren`}
                  emptyLabel="Drop else blocks"
                  depth={depth + 1}
                  onInputChange={onInputChange}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                />
              }
            />
          ))
        )}
      </div>
    </SortableContext>
  );
}
