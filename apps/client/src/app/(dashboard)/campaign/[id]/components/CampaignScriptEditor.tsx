import React, { useCallback, useRef } from "react";
import { sanitizeHtml } from "../../../../../lib/client-security";
import { highlightCode } from "../../../../arena/components/CommandConsole/ScriptEditor/highlight";
import { useParserWorker } from "../../../../arena/components/CommandConsole/ScriptEditor/useParserWorker";
import { useAutocomplete } from "../../../../arena/components/CommandConsole/ScriptEditor/useAutocomplete";
import { AutocompleteDropdown } from "../../../../arena/components/CommandConsole/ScriptEditor/AutocompleteDropdown";

interface CampaignScriptEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function CampaignScriptEditor({
  value,
  onChange,
  placeholder,
  className,
}: CampaignScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const { syntaxValid, validateSyntax } = useParserWorker();

  const clearPrebuilt = useCallback(() => {}, []);
  const {
    suggestions,
    activeIdx,
    caretXY,
    handleChange,
    handleKeyDown,
    acceptSuggestion,
    clearSuggestions,
  } = useAutocomplete(onChange, clearPrebuilt, textareaRef, validateSyntax);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    clearSuggestions();
  }, [clearSuggestions]);

  const displayValue = value || placeholder || "";
  const isPlaceholder = !value && !!placeholder;

  return (
    <div className={`relative flex flex-col ${className ?? ""}`}>
      <div className="relative flex-1 min-h-0 flex flex-col rounded-xl border border-accent/20 bg-bg-primary group">
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl">
        <div
          ref={highlightRef}
          className={`absolute inset-0 py-3 pointer-events-none font-mono text-[13px] leading-6 tracking-[0.04em] overflow-hidden ${isPlaceholder ? "opacity-25 saturate-0" : "text-accent/80"}`}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightCode(displayValue)) }}
        />
        <textarea
          aria-label="AliScript code editor"
          id="script-editor"
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onBlur={() => setTimeout(clearSuggestions, 150)}
          className="relative flex-1 w-full py-3 font-mono text-[13px] leading-6 tracking-[0.04em] text-transparent caret-accent bg-transparent resize-none outline-none overflow-auto break-all custom-scrollbar selection:bg-accent/30 selection:text-transparent"
          style={{
            paddingLeft: "56px",
            paddingRight: "12px",
            boxShadow: "inset 0 0 30px rgba(var(--accent-rgb),0.03)",
            tabSize: 2,
            wordBreak: "break-all",
          }}
          spellCheck={false}
        />
        <div className="absolute top-2 right-5 text-[9px] text-accent/40 tracking-[0.3em] font-black pointer-events-none select-none">
          [ALISCRIPT_V2]{" "}
          {syntaxValid === false && (
            <span className="text-red-500 ml-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">
              SYNTAX_ERR
            </span>
          )}
        </div>
        </div>
        <AutocompleteDropdown
          suggestions={suggestions}
          activeIdx={activeIdx}
          caretXY={caretXY}
          onAccept={acceptSuggestion}
        />
      </div>
    </div>
  );
}