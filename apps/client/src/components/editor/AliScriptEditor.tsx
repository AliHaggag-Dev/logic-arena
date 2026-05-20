"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { getAliScriptSuggestions, type AliScriptSuggestion } from "./aliScriptAutocomplete";
import { tokenizeAliScript, type AliScriptToken, type TokenType } from "./aliScriptTokenizer";

interface AliScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  isMobile: boolean;
  onRun?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

interface CaretPosition {
  top: number;
  left: number;
}

const INDENT = "  ";
const LINE_HEIGHT = 24;
const DESKTOP_FONT_SIZE = 14;
const MOBILE_FONT_SIZE = 12;
const EDITOR_PADDING_TOP = 12;
const EDITOR_PADDING_LEFT = 56;
const APPROX_CHAR_WIDTH_DESKTOP = 8.4;
const APPROX_CHAR_WIDTH_MOBILE = 7.2;
const MAX_AUTOCOMPLETE_LEFT = 360;

const TOKEN_CLASS: Record<TokenType, string> = {
  KEYWORD: "text-[color:var(--sem-warning)]",
  COMMAND: "text-accent drop-shadow-[0_0_6px_rgba(var(--accent-rgb),0.6)]",
  FUNCTION: "text-[color:var(--sem-info)]",
  RESERVED_VAR: "text-[color:var(--sem-success)]",
  SYSTEM_VAR: "text-[color:var(--sem-danger)]",
  NUMBER: "text-[color:var(--sem-warning)]",
  STRING: "text-[color:var(--sem-success)]",
  OPERATOR: "text-accent/60",
  COMMENT: "text-accent/35",
  IDENTIFIER: "text-accent/80",
};

function getCurrentWordRange(value: string, cursorPosition: number): { start: number; end: number } {
  const prefixMatch = value.slice(0, cursorPosition).match(/[A-Za-z_][A-Za-z0-9_]*$/);
  const suffixMatch = value.slice(cursorPosition).match(/^[A-Za-z0-9_]*/);
  const start = cursorPosition - (prefixMatch?.[0].length ?? 0);
  const end = cursorPosition + (suffixMatch?.[0].length ?? 0);

  return { start, end };
}

function getIndentForNewLine(value: string, cursorPosition: number): string {
  const lineStart = value.lastIndexOf("\n", cursorPosition - 1) + 1;
  const line = value.slice(lineStart, cursorPosition);
  const currentIndent = line.match(/^\s*/)?.[0] ?? "";
  const trimmedLine = line.trim().toUpperCase();

  if (trimmedLine === "END" || trimmedLine.startsWith("END ")) {
    return currentIndent.slice(0, Math.max(0, currentIndent.length - INDENT.length));
  }

  if (/^(IF|WHILE|FOR|DO)\b/.test(trimmedLine)) {
    return `${currentIndent}${INDENT}`;
  }

  return currentIndent;
}

function getCaretPosition(value: string, cursorPosition: number, isMobile: boolean): CaretPosition {
  const beforeCursor = value.slice(0, cursorPosition);
  const lines = beforeCursor.split("\n");
  const lineIndex = lines.length - 1;
  const columnIndex = lines.at(-1)?.length ?? 0;
  const charWidth = isMobile ? APPROX_CHAR_WIDTH_MOBILE : APPROX_CHAR_WIDTH_DESKTOP;

  return {
    top: EDITOR_PADDING_TOP + (lineIndex + 1) * LINE_HEIGHT,
    left: Math.min(EDITOR_PADDING_LEFT + columnIndex * charWidth, MAX_AUTOCOMPLETE_LEFT),
  };
}

function renderHighlightedCode(value: string, tokens: AliScriptToken[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  tokens.forEach((token) => {
    if (token.start > cursor) {
      nodes.push(value.slice(cursor, token.start));
    }

    nodes.push(
      <span key={`${token.start}-${token.end}`} className={TOKEN_CLASS[token.type]}>
        {token.value}
      </span>,
    );
    cursor = token.end;
  });

  if (cursor < value.length) {
    nodes.push(value.slice(cursor));
  }

  return nodes;
}

export function AliScriptEditor({
  value,
  onChange,
  isMobile,
  onRun,
  readOnly = false,
  placeholder,
  className,
}: AliScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeOverlayRef = useRef<HTMLPreElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<AliScriptSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [caretPosition, setCaretPosition] = useState<CaretPosition>({ top: 0, left: EDITOR_PADDING_LEFT });
  const [placeholderActive, setPlaceholderActive] = useState(false);

  const tokens = useMemo(() => tokenizeAliScript(value), [value]);
  const highlightedCode = useMemo(() => renderHighlightedCode(value, tokens), [tokens, value]);
  const lines = useMemo(() => value.split("\n"), [value]);
  const lineCount = Math.max(lines.length, 1);
  const fontSize = isMobile ? MOBILE_FONT_SIZE : DESKTOP_FONT_SIZE;

  const syncSuggestions = useCallback((nextValue: string, cursorPosition: number) => {
    const nextSuggestions = getAliScriptSuggestions(nextValue, cursorPosition);
    setSuggestions(nextSuggestions);
    setActiveSuggestionIndex(0);
    setCaretPosition(getCaretPosition(nextValue, cursorPosition, isMobile));
  }, [isMobile]);

  const updateValue = useCallback((nextValue: string, nextCursorPosition?: number) => {
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      const cursorPosition = nextCursorPosition ?? textareaRef.current?.selectionStart ?? nextValue.length;
      if (textareaRef.current && nextCursorPosition !== undefined) {
        textareaRef.current.selectionStart = nextCursorPosition;
        textareaRef.current.selectionEnd = nextCursorPosition;
      }
      syncSuggestions(nextValue, cursorPosition);
    });
  }, [onChange, syncSuggestions]);

  const acceptSuggestion = useCallback((suggestion: AliScriptSuggestion) => {
    const textarea = textareaRef.current;
    const cursorPosition = textarea?.selectionStart ?? value.length;
    const { start, end } = getCurrentWordRange(value, cursorPosition);
    const nextValue = `${value.slice(0, start)}${suggestion.insertText}${value.slice(end)}`;
    const nextCursorPosition = start + suggestion.insertText.length;

    updateValue(nextValue, nextCursorPosition);
    setSuggestions([]);
    textareaRef.current?.focus();
  }, [updateValue, value]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    syncSuggestions(nextValue, event.target.selectionStart);
  }, [onChange, syncSuggestions]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onRun?.();
      return;
    }

    if (suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestionIndex((currentIndex) => (currentIndex + 1) % suggestions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestionIndex((currentIndex) => (currentIndex - 1 + suggestions.length) % suggestions.length);
        return;
      }

      if (event.key === "Enter" && suggestions[activeSuggestionIndex]) {
        event.preventDefault();
        acceptSuggestion(suggestions[activeSuggestionIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSuggestions([]);
        return;
      }
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = `${value.slice(0, start)}${INDENT}${value.slice(end)}`;
      const nextCursorPosition = start + INDENT.length;
      updateValue(nextValue, nextCursorPosition);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = getIndentForNewLine(value, start);
      const insertText = `\n${indent}`;
      const nextValue = `${value.slice(0, start)}${insertText}${value.slice(end)}`;
      const nextCursorPosition = start + insertText.length;
      updateValue(nextValue, nextCursorPosition);
    }
  }, [acceptSuggestion, activeSuggestionIndex, onRun, suggestions, updateValue, value]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLTextAreaElement>) => {
    if (codeOverlayRef.current) {
      codeOverlayRef.current.scrollTop = event.currentTarget.scrollTop;
      codeOverlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    if (lineNumberRef.current) {
      lineNumberRef.current.scrollTop = event.currentTarget.scrollTop;
    }
    setSuggestions([]);
  }, []);

  const handleSelect = useCallback((event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    syncSuggestions(value, event.currentTarget.selectionStart);
  }, [syncSuggestions, value]);

  const displayPlaceholder = !value && placeholder;
  const overlayText = displayPlaceholder ? placeholder : value || " ";

  return (
    <div className={`relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent/20 bg-bg-primary ${className ?? ""}`}>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-t-xl">
        <div
          ref={lineNumberRef}
          className="pointer-events-none absolute left-0 top-0 z-10 w-[44px] overflow-hidden border-r border-accent/10 py-3 text-right font-mono text-[10px] leading-6 text-accent/30"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index} className="pr-3">
              {index + 1}
            </div>
          ))}
        </div>

        <pre
          ref={codeOverlayRef}
          className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words py-3 pr-3 font-mono leading-6 tracking-normal ${displayPlaceholder ? "text-accent/25" : "text-accent/80"}`}
          style={{
            paddingLeft: `${EDITOR_PADDING_LEFT}px`,
            fontSize: `${fontSize}px`,
            tabSize: 2,
          }}
          aria-hidden="true"
        >
          {displayPlaceholder ? overlayText : highlightedCode}
        </pre>

        <textarea
          ref={textareaRef}
          aria-label="AliScript code editor"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onSelect={handleSelect}
          onFocus={() => setPlaceholderActive(true)}
          onBlur={() => {
            setPlaceholderActive(false);
            window.setTimeout(() => setSuggestions([]), 120);
          }}
          readOnly={readOnly}
          spellCheck={false}
          className="relative z-20 min-h-full w-full flex-1 resize-none overflow-auto bg-transparent py-3 pr-3 font-mono leading-6 tracking-normal text-transparent caret-accent outline-none selection:bg-accent/30"
          style={{
            minHeight: "inherit",
            paddingLeft: `${EDITOR_PADDING_LEFT}px`,
            fontSize: `${fontSize}px`,
            tabSize: 2,
            boxShadow: "inset 0 0 32px rgba(var(--accent-rgb),0.035)",
          }}
        />

        {suggestions.length > 0 && placeholderActive && (
          <div
            className="absolute z-30 max-h-[220px] w-[min(320px,calc(100%-64px))] overflow-hidden rounded-lg border border-accent/30 bg-bg-secondary shadow-[0_0_24px_rgba(var(--accent-rgb),0.16)]"
            style={{ top: `${caretPosition.top}px`, left: `${caretPosition.left}px` }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                type="button"
                key={suggestion.label}
                onMouseDown={(event) => {
                  event.preventDefault();
                  acceptSuggestion(suggestion);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-mono transition-colors ${
                  index === activeSuggestionIndex ? "bg-accent/15 text-accent" : "text-accent/70 hover:bg-accent/10 hover:text-accent"
                }`}
              >
                <span className="truncate text-[11px] font-black tracking-[0.08em]">{suggestion.label}</span>
                <span className="shrink-0 text-[8px] uppercase tracking-[0.18em] text-accent/40">{suggestion.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-accent/10 bg-accent/[0.025] px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-accent/40">
        <span>{lineCount} Lines</span>
        <span>{value.length} Chars</span>
      </div>
    </div>
  );
}

