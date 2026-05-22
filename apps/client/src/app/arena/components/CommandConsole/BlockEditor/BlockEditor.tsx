"use client";

import React, { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BlockCanvas } from "./BlockCanvas";
import { BlockPalette } from "./BlockPalette";
import { generateScript } from "./blockToScript";
import type { BlockNode, BlockType } from "./blockTypes";
import { BLOCK_DEFINITION_BY_TYPE } from "./blockTypes";
import type { BlockSlot } from "./Block";

interface BlockEditorProps {
  scriptInput: string;
  setScriptInput: (value: string) => void;
  handleDeployBrain: (script: string) => void;
  onDeployDone?: () => void;
}

type ContainerId = "root" | `${string}:${BlockSlot}`;

interface RemovedBlockResult {
  blocks: BlockNode[];
  removed: BlockNode | null;
}

const DRAG_DISTANCE_PX = 8;
const CANVAS_REGION_HEIGHT_PX = 104;

function createBlock(type: BlockType): BlockNode {
  const definition = BLOCK_DEFINITION_BY_TYPE[type];
  return {
    id: `${type.toLowerCase()}-${crypto.randomUUID()}`,
    type,
    inputs: { ...definition.defaultInputs },
    children: definition.childSlots ? [] : undefined,
    elseChildren: definition.childSlots === "thenElse" ? [] : undefined,
  };
}

function isContainerId(id: string): id is ContainerId {
  return id === "root" || id.endsWith(":children") || id.endsWith(":elseChildren");
}

function childContainer(parentId: string, slot: BlockSlot): ContainerId {
  return `${parentId}:${slot}`;
}

function parseChildContainer(containerId: ContainerId): { parentId: string; slot: BlockSlot } | null {
  if (containerId === "root") return null;
  const [parentId, slot] = containerId.split(":");
  return slot === "children" || slot === "elseChildren" ? { parentId, slot } : null;
}

function findBlock(blocks: BlockNode[], blockId: string): BlockNode | null {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    const childMatch = findBlock(block.children ?? [], blockId);
    if (childMatch) return childMatch;
    const elseMatch = findBlock(block.elseChildren ?? [], blockId);
    if (elseMatch) return elseMatch;
  }
  return null;
}

function findContainer(blocks: BlockNode[], blockId: string, containerId: ContainerId = "root"): ContainerId | null {
  for (const block of blocks) {
    if (block.id === blockId) return containerId;
    const childMatch = findContainer(block.children ?? [], blockId, childContainer(block.id, "children"));
    if (childMatch) return childMatch;
    const elseMatch = findContainer(block.elseChildren ?? [], blockId, childContainer(block.id, "elseChildren"));
    if (elseMatch) return elseMatch;
  }
  return null;
}

function getContainerBlocks(blocks: BlockNode[], containerId: ContainerId): BlockNode[] {
  if (containerId === "root") return blocks;
  const parsed = parseChildContainer(containerId);
  if (!parsed) return [];
  const parent = findBlock(blocks, parsed.parentId);
  return parsed.slot === "children" ? parent?.children ?? [] : parent?.elseChildren ?? [];
}

function updateContainer(blocks: BlockNode[], containerId: ContainerId, updater: (current: BlockNode[]) => BlockNode[]): BlockNode[] {
  if (containerId === "root") return updater(blocks);
  const parsed = parseChildContainer(containerId);
  if (!parsed) return blocks;

  return blocks.map((block) => {
    if (block.id === parsed.parentId) {
      return {
        ...block,
        [parsed.slot]: updater(parsed.slot === "children" ? block.children ?? [] : block.elseChildren ?? []),
      };
    }
    return {
      ...block,
      children: updateContainer(block.children ?? [], containerId, updater),
      elseChildren: updateContainer(block.elseChildren ?? [], containerId, updater),
    };
  });
}

function removeBlock(blocks: BlockNode[], blockId: string): RemovedBlockResult {
  let removed: BlockNode | null = null;

  const nextBlocks = blocks.reduce<BlockNode[]>((accumulator, block) => {
    if (block.id === blockId) {
      removed = block;
      return accumulator;
    }
    const childResult = removeBlock(block.children ?? [], blockId);
    const elseResult = removeBlock(block.elseChildren ?? [], blockId);
    if (childResult.removed) removed = childResult.removed;
    if (elseResult.removed) removed = elseResult.removed;
    accumulator.push({
      ...block,
      children: childResult.blocks,
      elseChildren: elseResult.blocks,
    });
    return accumulator;
  }, []);

  return { blocks: nextBlocks, removed };
}

function updateBlockInput(blocks: BlockNode[], blockId: string, key: string, value: string | number): BlockNode[] {
  return blocks.map((block) => {
    if (block.id === blockId) {
      return { ...block, inputs: { ...block.inputs, [key]: value } };
    }
    return {
      ...block,
      children: updateBlockInput(block.children ?? [], blockId, key, value),
      elseChildren: updateBlockInput(block.elseChildren ?? [], blockId, key, value),
    };
  });
}

function insertBlock(blocks: BlockNode[], containerId: ContainerId, block: BlockNode, index?: number): BlockNode[] {
  return updateContainer(blocks, containerId, (current) => {
    const next = [...current];
    const boundedIndex = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
    next.splice(boundedIndex, 0, block);
    return next;
  });
}

function targetFromOverId(blocks: BlockNode[], overId: string): { containerId: ContainerId; index?: number } {
  if (isContainerId(overId)) return { containerId: overId };
  const containerId = findContainer(blocks, overId) ?? "root";
  const containerBlocks = getContainerBlocks(blocks, containerId);
  return { containerId, index: containerBlocks.findIndex((block) => block.id === overId) };
}

function blockTypeFromDraggableId(id: string): BlockType | null {
  if (!id.startsWith("palette:")) return null;
  const type = id.replace("palette:", "") as BlockType;
  return BLOCK_DEFINITION_BY_TYPE[type] ? type : null;
}

function defaultBlocks(): BlockNode[] {
  const aim = createBlock("SET_VAR");
  const fire = createBlock("FIRE");
  const scan = createBlock("SCAN");
  const move = createBlock("MOVE");
  const branch = createBlock("IF_THEN_ELSE");
  branch.children = [aim, fire];
  branch.elseChildren = [scan, move];
  return [branch];
}

export function BlockEditor({
  scriptInput,
  setScriptInput,
  handleDeployBrain,
  onDeployDone,
}: BlockEditorProps): React.ReactElement {
  const [blocks, setBlocks] = useState<BlockNode[]>(() => defaultBlocks());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activePaletteType, setActivePaletteType] = useState<BlockType | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: DRAG_DISTANCE_PX } }));
  const generatedScript = useMemo(() => generateScript(blocks), [blocks]);
  const loadedTextLine = scriptInput.trim() ? "Existing text script stays untouched until deploy." : "Generated AliScript updates on deploy.";

  const addBlock = (type: BlockType): void => setBlocks((current) => insertBlock(current, "root", createBlock(type)));

  const addChild = (parentId: string, slot: BlockSlot, type: BlockType): void => {
    setBlocks((current) => insertBlock(current, childContainer(parentId, slot), createBlock(type)));
  };

  const deleteBlock = (blockId: string): void => {
    setBlocks((current) => removeBlock(current, blockId).blocks);
  };

  const changeInput = (blockId: string, key: string, value: string | number): void => {
    setBlocks((current) => updateBlockInput(current, blockId, key, value));
  };

  const handleDragStart = (event: DragStartEvent): void => {
    setActivePaletteType(blockTypeFromDraggableId(String(event.active.id)));
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    setActivePaletteType(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    const paletteType = blockTypeFromDraggableId(activeId);
    setBlocks((current) => {
      const target = targetFromOverId(current, overId);
      if (paletteType) {
        return insertBlock(current, target.containerId, createBlock(paletteType), target.index);
      }

      const sourceContainer = findContainer(current, activeId);
      if (!sourceContainer) return current;

      if (sourceContainer === target.containerId && target.index !== undefined) {
        const sourceBlocks = getContainerBlocks(current, sourceContainer);
        const oldIndex = sourceBlocks.findIndex((block) => block.id === activeId);
        if (oldIndex < 0 || oldIndex === target.index) return current;
        return updateContainer(current, sourceContainer, (source) => arrayMove(source, oldIndex, target.index ?? oldIndex));
      }

      const removedResult = removeBlock(current, activeId);
      if (!removedResult.removed) return current;
      return insertBlock(removedResult.blocks, target.containerId, removedResult.removed, target.index);
    });
  };

  const deploy = (): void => {
    setScriptInput(generatedScript);
    handleDeployBrain(generatedScript);
    onDeployDone?.();
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-full w-full flex-col gap-2 rounded-3xl">
        <div
          className="flex shrink-0 items-center justify-between gap-3 rounded-3xl px-3 py-1.5 backdrop-blur-2xl"
          style={{
            background: "rgba(var(--arena-white-rgb),0.07)",
            border: "1px solid rgba(var(--arena-white-rgb),0.1)",
            boxShadow: "inset 0 1px 0 rgba(var(--arena-white-rgb),0.08)",
          }}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.24em]" style={{ color: "var(--arena-green)" }}>
              Block Core
            </span>
            <span className="hidden truncate text-[9px] font-bold uppercase tracking-[0.1em] md:block" style={{ color: "rgba(var(--arena-white-rgb),0.5)" }}>
              {loadedTextLine}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen((open) => !open)}
              className="min-h-11 shrink-0 rounded-2xl px-4 text-[10px] font-black uppercase tracking-[0.12em]"
              style={{
                color: previewOpen ? "var(--arena-bg-dark)" : "var(--arena-cyan)",
                background: previewOpen ? "var(--arena-cyan)" : "rgba(var(--arena-cyan-rgb),0.12)",
                border: "1px solid rgba(var(--arena-cyan-rgb),0.35)",
                boxShadow: previewOpen ? "0 8px 18px rgba(var(--arena-cyan-rgb),0.18)" : "none",
              }}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={deploy}
              className="min-h-11 shrink-0 rounded-2xl px-4 text-[10px] font-black uppercase tracking-[0.12em]"
              style={{
                color: "var(--arena-bg-dark)",
                background: "var(--arena-green)",
                border: "1px solid var(--arena-green)",
                boxShadow: "0 10px 20px rgba(var(--arena-green-rgb),0.22), inset 0 1px 0 rgba(var(--arena-white-rgb),0.35)",
              }}
            >
              Deploy
            </button>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 overflow-hidden" style={{ height: CANVAS_REGION_HEIGHT_PX }}>
          <BlockCanvas blocks={blocks} onInputChange={changeInput} onAddChild={addChild} onDelete={deleteBlock} />
          {previewOpen && (
            <textarea
              aria-label="Generated AliScript preview"
              readOnly
              value={generatedScript}
              className="hidden h-full w-64 resize-none rounded-3xl p-3 font-mono text-[11px] leading-5 outline-none md:block"
              style={{ color: "var(--arena-cyan)", background: "rgba(var(--arena-white-rgb),0.07)", border: "1px solid rgba(var(--arena-white-rgb),0.12)" }}
            />
          )}
        </div>

        {previewOpen && (
          <textarea
            aria-label="Generated AliScript preview mobile"
            readOnly
            value={generatedScript}
            className="h-20 shrink-0 resize-none rounded-3xl p-3 font-mono text-[11px] leading-5 outline-none md:hidden"
            style={{ color: "var(--arena-cyan)", background: "rgba(var(--arena-white-rgb),0.07)", border: "1px solid rgba(var(--arena-white-rgb),0.12)" }}
          />
        )}

        <BlockPalette onAddBlock={addBlock} />

      </div>
      <DragOverlay>
        {activePaletteType ? (
          <div
            className="min-h-12 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em]"
            style={{
              color: "var(--arena-bg-dark)",
              background: BLOCK_DEFINITION_BY_TYPE[activePaletteType].colorVar,
              border: "1px solid color-mix(in oklab, var(--arena-white) 30%, transparent)",
            }}
          >
            {BLOCK_DEFINITION_BY_TYPE[activePaletteType].label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
