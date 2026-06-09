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
  showArrows?: boolean;
  onMoveBlock?: (blockId: string, direction: "up" | "down") => void;
}

const NESTED_CANVAS_MIN_HEIGHT_PX = 52;

export function BlockCanvas({
  blocks,
  containerId = "root",
  emptyLabel = "Tap a command below or drag it here",
  depth = 0,
  onInputChange,
  onAddChild,
  onDelete,
  showArrows = false,
  onMoveBlock,
}: BlockCanvasProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id: containerId });
  const blockIds = blocks.map((block) => block.id);
  const isRoot = depth === 0;

  return (
    <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex min-w-0 flex-col gap-2 p-2 ${isRoot ? "h-full overflow-y-auto" : "shrink-0 overflow-visible"}`}
        style={{
          minHeight: isRoot ? undefined : NESTED_CANVAS_MIN_HEIGHT_PX,
          background: isOver ? "rgba(var(--arena-cyan-rgb),0.08)" : "rgba(var(--arena-white-rgb),0.03)",
          border: isOver ? "1px solid rgba(var(--arena-cyan-rgb),0.35)" : isRoot ? "none" : "1px dashed rgba(var(--arena-white-rgb),0.12)",
        }}
      >
        {blocks.length === 0 ? (
          <div
            className="flex min-h-[72px] flex-1 items-center justify-center rounded-xl px-4 text-center text-[11px]"
            style={{
              color: "rgba(var(--arena-white-rgb),0.42)",
              border: "1px dashed rgba(var(--arena-white-rgb),0.14)",
              background: "rgba(var(--arena-white-rgb),0.02)",
            }}
          >
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
              showArrows={showArrows}
              onMoveBlock={onMoveBlock}
              childContent={
                <BlockCanvas
                  blocks={block.children ?? []}
                  containerId={`${block.id}:children`}
                  emptyLabel="Drop blocks inside"
                  depth={depth + 1}
                  onInputChange={onInputChange}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                  showArrows={showArrows}
                  onMoveBlock={onMoveBlock}
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
                  showArrows={showArrows}
                  onMoveBlock={onMoveBlock}
                />
              }
            />
          ))
        )}
      </div>
    </SortableContext>
  );
}
