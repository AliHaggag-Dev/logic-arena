"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { BlockSelect } from "./BlockSelect";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockNode, BlockType } from "./blockTypes";
import {
  BLOCK_DEFINITION_BY_TYPE,
  CONDITION_OPTIONS,
  EXPRESSION_OPTIONS,
  FUNCTION_OPTIONS,
  QUERY_OPTIONS,
  WRITABLE_IDENTIFIERS,
} from "./blockTypes";

export type BlockSlot = "children" | "elseChildren";

interface BlockProps {
  block: BlockNode;
  onInputChange: (blockId: string, key: string, value: string | number) => void;
  onAddChild: (parentId: string, slot: BlockSlot, type: BlockType) => void;
  onDelete: (blockId: string) => void;
  showArrows?: boolean;
  onMoveBlock?: (blockId: string, direction: "up" | "down") => void;
  childContent?: React.ReactNode;
  elseContent?: React.ReactNode;
}

interface CustomBlockStyle extends React.CSSProperties {
  "--block-accent": string;
}

const NUMBER_INPUT_MIN_WIDTH_PX = 64;
const ACTION_BUTTON_SIZE_PX = 44;

const OPERATOR_OPTIONS: string[] = ["+", "-", "*", "/", "%"];
const ARRAY_LITERAL_OPTIONS: string[] = ["0, 1, 2", "NEAREST_VISIBLE_X, NEAREST_VISIBLE_Y", "GET_ALL_VISIBLE_ENEMIES()", "RECEIVE()"];
const DICT_LITERAL_OPTIONS: string[] = ['mode: "SCAN", target_id: 0', 'mode: "ATTACK", target_id: 0', 'lastSeen: NEAREST_VISIBLE_X, threat: VISIBLE_ENEMY_COUNT'];
const DICT_VALUE_OPTIONS: string[] = ['"SCAN"', '"ATTACK"', '"EVADE"', "NEAREST_VISIBLE_X", "NEAREST_VISIBLE_Y", "0", "1"];

function selectOptions(options: string[], current: string): string[] {
  return options.includes(current) ? options : [current, ...options];
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}): React.ReactElement {
  return <BlockSelect label={label} value={value} options={selectOptions(options, value)} onChange={onChange} />;
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}): React.ReactElement {
  return (
    <input
      aria-label={label}
      type="number"
      value={value}
      min={0}
      onChange={(event) => onChange(Number(event.target.value))}
      className="min-h-11 w-full rounded-xl px-3 text-[11px] font-medium outline-none"
      style={{
        minWidth: NUMBER_INPUT_MIN_WIDTH_PX,
        background: "rgba(var(--arena-white-rgb),0.1)",
        border: "1px solid rgba(var(--arena-white-rgb),0.14)",
        color: "var(--arena-white)",
        boxShadow: "inset 0 1px 0 rgba(var(--arena-white-rgb),0.08)",
      }}
    />
  );
}

function InputControls({
  block,
  onInputChange,
}: {
  block: BlockNode;
  onInputChange: (blockId: string, key: string, value: string | number) => void;
}): React.ReactElement | null {
  const stringValue = (key: string, fallback: string): string => String(block.inputs[key] ?? fallback);
  const numberValue = (key: string, fallback: number): number => Number(block.inputs[key] ?? fallback);
  const change = (key: string, value: string | number): void => onInputChange(block.id, key, value);

  switch (block.type) {
    case "WAIT":
      return <NumberInput label="Wait ticks" value={numberValue("ticks", 1)} onChange={(value) => change("ticks", value)} />;
    case "TELEPORT":
      return (
        <>
          <NumberInput label="Teleport x" value={numberValue("x", 400)} onChange={(value) => change("x", value)} />
          <NumberInput label="Teleport y" value={numberValue("y", 300)} onChange={(value) => change("y", value)} />
        </>
      );
    case "DASH":
      return <NumberInput label="Dash distance" value={numberValue("distance", 80)} onChange={(value) => change("distance", value)} />;
    case "TAUNT":
      return <SelectInput label="Taunt message" value={stringValue("message", '"COME AT ME"')} options={['"COME AT ME"', '"TOO SLOW"', '"TARGET LOCKED"']} onChange={(value) => change("message", value)} />;
    case "IF_THEN":
    case "IF_THEN_ELSE":
    case "WHILE_DO":
      return <SelectInput label="Condition" value={stringValue("condition", "TRUE")} options={CONDITION_OPTIONS} onChange={(value) => change("condition", value)} />;
    case "FOR_LOOP":
      return (
        <>
          <SelectInput label="Iterator" value={stringValue("iterator", "i")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("iterator", value)} />
          <NumberInput label="Start value" value={numberValue("start", 0)} onChange={(value) => change("start", value)} />
          <SelectInput label="End expression" value={stringValue("end", "count")} options={EXPRESSION_OPTIONS} onChange={(value) => change("end", value)} />
        </>
      );
    case "FUNCTION_DEF":
    case "CALL_FUNCTION":
      return <SelectInput label="Function name" value={stringValue("name", "retreat")} options={["retreat", "engage", "scanLoop", "evade"]} onChange={(value) => change("name", value)} />;
    case "SET_VAR":
      return (
        <>
          <SelectInput label="Target variable" value={stringValue("target", "rotation")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Value expression" value={stringValue("value", "0")} options={EXPRESSION_OPTIONS} onChange={(value) => change("value", value)} />
        </>
      );
    case "UPDATE_VAR":
      return (
        <>
          <SelectInput label="Target variable" value={stringValue("target", "i")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Operator" value={stringValue("operator", "+")} options={OPERATOR_OPTIONS} onChange={(value) => change("operator", value)} />
          <SelectInput label="Update value" value={stringValue("value", "1")} options={EXPRESSION_OPTIONS} onChange={(value) => change("value", value)} />
        </>
      );
    case "CREATE_ARRAY":
      return (
        <>
          <SelectInput label="Array variable" value={stringValue("target", "queue")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Array values" value={stringValue("values", "")} options={ARRAY_LITERAL_OPTIONS} onChange={(value) => change("values", value)} />
        </>
      );
    case "CREATE_DICT":
      return (
        <>
          <SelectInput label="Dictionary variable" value={stringValue("target", "state")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Dictionary entries" value={stringValue("entries", "")} options={DICT_LITERAL_OPTIONS} onChange={(value) => change("entries", value)} />
        </>
      );
    case "ARRAY_PUSH":
      return (
        <>
          <SelectInput label="Array variable" value={stringValue("target", "queue")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Pushed value" value={stringValue("value", "0")} options={EXPRESSION_OPTIONS} onChange={(value) => change("value", value)} />
        </>
      );
    case "ARRAY_POP":
      return (
        <>
          <SelectInput label="Pop target variable" value={stringValue("target", "last")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Source array" value={stringValue("source", "queue")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("source", value)} />
        </>
      );
    case "DICT_SET":
      return (
        <>
          <SelectInput label="Dictionary path" value={stringValue("target", "state.mode")} options={["state.mode", 'state["mode"]', "state.target_id", "state.threat"]} onChange={(value) => change("target", value)} />
          <SelectInput label="Dictionary value" value={stringValue("value", '"SCAN"')} options={DICT_VALUE_OPTIONS} onChange={(value) => change("value", value)} />
        </>
      );
    case "QUERY_SENSOR":
      return <SelectInput label="Sensor query" value={stringValue("query", "GET_HEALTH")} options={QUERY_OPTIONS} onChange={(value) => change("query", value)} />;
    case "BROADCAST":
      return <SelectInput label="Broadcast payload" value={stringValue("payload", "state")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("payload", value)} />;
    case "RECEIVE_INBOX":
      return <SelectInput label="Store in variable" value={stringValue("target", "messages")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />;
    case "SET_FUNCTION":
      return (
        <>
          <SelectInput label="Target variable" value={stringValue("target", "aim")} options={WRITABLE_IDENTIFIERS} onChange={(value) => change("target", value)} />
          <SelectInput label="Function expression" value={stringValue("expression", "RANDOM()")} options={FUNCTION_OPTIONS} onChange={(value) => change("expression", value)} />
        </>
      );
    default:
      return null;
  }
}

export function Block({
  block,
  onInputChange,
  onAddChild,
  onDelete,
  showArrows = false,
  onMoveBlock,
  childContent,
  elseContent,
}: BlockProps): React.ReactElement {
  const definition = BLOCK_DEFINITION_BY_TYPE[block.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style: CustomBlockStyle = {
    "--block-accent": definition.colorVar,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="min-w-0 touch-manipulation">
      <div
        className="rounded-2xl p-2.5"
        style={{
          background: "color-mix(in srgb, var(--card) 8%, rgba(var(--arena-black-rgb),0.42))",
          border: "1px solid rgba(var(--arena-white-rgb),0.1)",
          boxShadow: "inset 0 1px 0 rgba(var(--arena-white-rgb),0.05)",
        }}
      >
        <div className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
          <div className="flex items-start gap-0.5">
            <button
              type="button"
              aria-label={`Drag ${definition.label} block`}
              title="Drag block"
              {...attributes}
              {...listeners}
              className="flex shrink-0 items-center justify-center rounded-lg text-[11px]"
              style={{
                minHeight: ACTION_BUTTON_SIZE_PX,
                minWidth: ACTION_BUTTON_SIZE_PX,
                color: "rgba(var(--arena-white-rgb),0.55)",
                background: "rgba(var(--arena-white-rgb),0.06)",
                border: "1px solid rgba(var(--arena-white-rgb),0.1)",
              }}
            >
              ⋮⋮
            </button>
            {showArrows && (
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  aria-label="Move block up"
                  title="Move block up"
                  onClick={(e) => { e.stopPropagation(); onMoveBlock?.(block.id, "up"); }}
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    height: 22,
                    width: 22,
                    color: "rgba(var(--arena-white-rgb),0.55)",
                    background: "rgba(var(--arena-white-rgb),0.06)",
                    border: "1px solid rgba(var(--arena-white-rgb),0.1)",
                  }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Move block down"
                  title="Move block down"
                  onClick={(e) => { e.stopPropagation(); onMoveBlock?.(block.id, "down"); }}
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    height: 22,
                    width: 22,
                    color: "rgba(var(--arena-white-rgb),0.55)",
                    background: "rgba(var(--arena-white-rgb),0.06)",
                    border: "1px solid rgba(var(--arena-white-rgb),0.1)",
                  }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate font-mono text-[12px] font-semibold" style={{ color: definition.colorVar }}>
              {definition.label}
            </span>
            <span className="block truncate text-[10px]" style={{ color: "rgba(var(--arena-white-rgb),0.48)" }}>
              {definition.description}
            </span>
          </div>
          <div className="order-last col-span-full grid min-w-0 grid-cols-1 gap-2">
            <InputControls block={block} onInputChange={onInputChange} />
          </div>
          <button
            type="button"
            aria-label={`Delete ${definition.label} block`}
            title="Delete block"
            onClick={() => onDelete(block.id)}
            className="flex items-center justify-center rounded-lg text-[11px] font-semibold"
            style={{
              minHeight: ACTION_BUTTON_SIZE_PX,
              minWidth: ACTION_BUTTON_SIZE_PX,
              color: "var(--arena-red)",
              background: "rgba(var(--arena-red-rgb),0.1)",
              border: "1px solid rgba(var(--arena-red-rgb),0.22)",
            }}
          >
            ✕
          </button>
        </div>

        {definition.childSlots && (
          <div
            className="mt-2 flex flex-col gap-2 rounded-xl p-2"
            style={{ borderLeft: `2px solid ${definition.colorVar}`, background: "rgba(var(--arena-white-rgb),0.04)" }}
          >
            <div className="flex flex-col gap-2">
              <div>
                <span className="block text-[11px] font-semibold" style={{ color: "rgba(var(--arena-white-rgb),0.78)" }}>
                  Then
                </span>
                <span className="block text-[10px]" style={{ color: "rgba(var(--arena-white-rgb),0.45)" }}>
                  Runs when the condition is true
                </span>
              </div>
              <button
                type="button"
                onClick={() => onAddChild(block.id, "children", "MOVE")}
                className="min-h-11 rounded-lg px-3 text-[10px] font-semibold"
                style={{
                  color: "var(--arena-white)",
                  background: "rgba(var(--arena-white-rgb),0.08)",
                  border: "1px solid rgba(var(--arena-white-rgb),0.12)",
                }}
              >
                + Add to Then
              </button>
            </div>
            {childContent}
          </div>
        )}

        {definition.childSlots === "thenElse" && (
          <div className="mt-2 flex flex-col gap-2 rounded-xl p-2" style={{ borderLeft: "2px solid var(--arena-amber)", background: "rgba(var(--arena-white-rgb),0.04)" }}>
            <div className="flex flex-col gap-2">
              <div>
                <span className="block text-[11px] font-semibold" style={{ color: "rgba(var(--arena-amber-rgb),0.9)" }}>
                  Else
                </span>
                <span className="block text-[10px]" style={{ color: "rgba(var(--arena-white-rgb),0.45)" }}>
                  Runs when the condition is false
                </span>
              </div>
              <button
                type="button"
                onClick={() => onAddChild(block.id, "elseChildren", "SCAN")}
                className="min-h-11 rounded-lg px-3 text-[10px] font-semibold"
                style={{
                  color: "var(--arena-white)",
                  background: "rgba(var(--arena-white-rgb),0.08)",
                  border: "1px solid rgba(var(--arena-white-rgb),0.12)",
                }}
              >
                + Add to Else
              </button>
            </div>
            {elseContent}
          </div>
        )}
      </div>
    </div>
  );
}
