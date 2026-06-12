"use client";

import React, { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Eye, EyeOff, Plus, Rocket } from "lucide-react";
import { BlockCanvas } from "./BlockCanvas";
import { BlockPalette } from "./BlockPalette";
import { generateScript } from "./blockToScript";
import type { BlockNode, BlockType } from "./blockTypes";
import { BLOCK_DEFINITION_BY_TYPE } from "./blockTypes";
import type { BlockSlot } from "./Block";
import { useMediaQuery } from "../../../../../hooks/useMediaQuery";

interface BlockEditorProps {
  scriptInput: string;
  setScriptInput: (value: string) => void;
  handleDeployBrain: (script: string) => void;
  onDeployDone?: () => void;
  displayMode?: string;
  editorBlocks?: BlockNode[] | null;
  setEditorBlocks?: React.Dispatch<React.SetStateAction<BlockNode[] | null>>;
}

type ContainerId = "root" | `${string}:${BlockSlot}`;

interface RemovedBlockResult {
  blocks: BlockNode[];
  removed: BlockNode | null;
}

const DRAG_DISTANCE_PX = 8;

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
  displayMode,
  editorBlocks,
  setEditorBlocks,
}: BlockEditorProps): React.ReactElement {
  const [localBlocks, setLocalBlocks] = useState<BlockNode[]>(() => defaultBlocks());
  const blocks = editorBlocks ?? localBlocks;
  
  const setBlocks = (updater: BlockNode[] | ((current: BlockNode[]) => BlockNode[])) => {
    if (setEditorBlocks) {
      setEditorBlocks((prev) => {
        const current = prev ?? defaultBlocks();
        return typeof updater === "function" ? updater(current) : updater;
      });
    } else {
      setLocalBlocks(updater as any);
    }
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activePaletteType, setActivePaletteType] = useState<BlockType | null>(null);
  const isTouchDevice = useMediaQuery("(pointer: coarse)");
  
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: DRAG_DISTANCE_PX } });
  const sensors = useSensors(pointerSensor);
  
  const generatedScript = useMemo(() => generateScript(blocks), [blocks]);

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

  const moveBlock = (blockId: string, direction: "up" | "down"): void => {
    setBlocks((current) => {
      const containerId = findContainer(current, blockId);
      if (!containerId) return current;
      const sourceBlocks = getContainerBlocks(current, containerId);
      const index = sourceBlocks.findIndex((b) => b.id === blockId);
      if (index < 0) return current;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sourceBlocks.length) return current;
      return updateContainer(current, containerId, (source) => arrayMove(source, index, newIndex));
    });
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
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">

        <div className="flex w-full h-full flex-col overflow-hidden relative">
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-2xl bg-black/40 relative"
            style={{ border: "1px solid rgba(var(--arena-white-rgb),0.08)" }}
          >
            <BlockCanvas blocks={blocks} onInputChange={changeInput} onAddChild={addChild} onDelete={deleteBlock} showArrows={isTouchDevice} onMoveBlock={moveBlock} />
            
            {previewOpen && (
              <textarea
                aria-label="Generated AliScript preview"
                readOnly
                value={generatedScript}
                className="absolute inset-0 z-30 h-full w-full resize-none p-4 font-mono text-xs leading-6 outline-none shadow-2xl"
                style={{
                  color: "var(--arena-cyan)",
                  background: "rgba(var(--arena-black-rgb),0.95)",
                  backdropFilter: "blur(8px)",
                }}
              />
            )}
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40 px-4 py-1.5 rounded-full" style={{ background: "rgba(var(--arena-black-rgb),0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(var(--arena-white-rgb),0.1)" }}>
            <button
              type="button"
              aria-label={previewOpen ? "Hide preview" : "Show preview"}
              onClick={() => setPreviewOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 shadow-lg"
              style={{
                color: previewOpen ? "var(--arena-bg-dark)" : "var(--arena-cyan)",
                background: previewOpen ? "var(--arena-cyan)" : "rgba(var(--arena-white-rgb),0.05)",
                border: "1px solid rgba(var(--arena-cyan-rgb),0.3)",
              }}
            >
              {previewOpen ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
            <button
              type="button"
              aria-label="Add command"
              onClick={() => setIsPaletteOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 active:scale-[0.9]"
              style={{
                color: "var(--arena-bg-dark)",
                background: "var(--arena-cyan)",
                border: "1px solid rgba(var(--arena-cyan-rgb),0.5)",
                boxShadow: "0 4px 15px rgba(var(--arena-cyan-rgb),0.4)",
              }}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
            {displayMode !== 'TACTICAL' && (
              <button
                type="button"
                onClick={deploy}
                className="flex h-10 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-semibold transition-transform duration-200 active:scale-[0.98]"
                style={{
                  color: "var(--arena-bg-dark)",
                  background: "linear-gradient(135deg, var(--arena-green), color-mix(in srgb, var(--arena-green) 78%, var(--arena-cyan)))",
                  boxShadow: "0 4px 15px rgba(var(--arena-green-rgb),0.2)",
                }}
              >
                <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                Deploy
              </button>
            )}
          </div>
        </div>

        <div
          className={`absolute inset-0 z-50 flex w-full flex-col transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${!isPaletteOpen ? "pointer-events-none" : ""}`}
          style={{
            transform: isPaletteOpen ? "translateY(0)" : "translateY(100%)",
          }}
        >
          <BlockPalette 
            onAddBlock={(type) => {
              addBlock(type);
              setIsPaletteOpen(false);
            }} 
            onClose={() => setIsPaletteOpen(false)}
          />
        </div>
      </div>
      <DragOverlay>
        {activePaletteType ? (
          <div
            className="rounded-xl px-3 py-2 font-mono text-[11px] font-semibold"
            style={{
              color: "var(--arena-white)",
              background: "rgba(var(--arena-black-rgb),0.88)",
              border: `1px solid ${BLOCK_DEFINITION_BY_TYPE[activePaletteType].colorVar}`,
              boxShadow: "0 12px 28px rgba(var(--arena-black-rgb),0.45)",
            }}
          >
            {BLOCK_DEFINITION_BY_TYPE[activePaletteType].label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
