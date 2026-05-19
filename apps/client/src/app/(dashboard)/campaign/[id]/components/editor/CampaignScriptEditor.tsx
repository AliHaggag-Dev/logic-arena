import React, { useCallback, useRef, useState } from "react";
import { sanitizeHtml } from "../../../../../../lib/client-security";
import { highlightCode } from "../../../../../../components/shared-script-editor";
import { useParserWorker } from "../../../../../../components/shared-script-editor";
import { useAutocomplete } from "../../../../../../components/shared-script-editor";
import { AutocompleteDropdown } from "../../../../../../components/shared-script-editor";
import { WarningPanel } from "../../../../../../components/shared-script-editor";
import { DETAIL_COLORS_CSS } from "../../../../../../components/shared-script-editor";

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
  const { syntaxValid, validateSyntax, warnings } = useParserWorker();
  const [showWarnings, setShowWarnings] = useState(false);

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
        <div className="absolute top-2 right-5 flex items-center gap-2 text-[9px] text-accent/40 tracking-[0.3em] font-black pointer-events-none select-none">
          <span>[ALISCRIPT_V2]</span>{" "}
          {syntaxValid === false && (
            <span className="text-red-500 ml-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">
              SYNTAX_ERR
            </span>
          )}
          {warnings.length > 0 && (
            <button
              type="button"
              aria-label={`${warnings.length} semantic warning${warnings.length > 1 ? 's' : ''}`}
              className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/30 border border-amber-500/40 text-amber-400 text-[9px] tracking-[0.15em] font-bold cursor-pointer hover:bg-amber-800/40 hover:border-amber-400 transition-all animate-pulse"
              onClick={() => setShowWarnings(!showWarnings)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {warnings.length}
            </button>
          )}
        </div>
        </div>
        <AutocompleteDropdown
          suggestions={suggestions}
          activeIdx={activeIdx}
          caretXY={caretXY}
          onAccept={acceptSuggestion}
          detailColors={DETAIL_COLORS_CSS}
        />
        {showWarnings && warnings.length > 0 && (
          <WarningPanel warnings={warnings} onClose={() => setShowWarnings(false)} />
        )}
      </div>
    </div>
  );
}
