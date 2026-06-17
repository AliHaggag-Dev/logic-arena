"use client";

import React, { useRef, useCallback, useState } from "react";
import { highlightCode } from "../../../../../../components/shared-script-editor";
import { useParserWorker } from "../../../../../../components/shared-script-editor";
import { useAutocomplete } from "../../../../../../components/shared-script-editor";
import { AutocompleteDropdown } from "../../../../../../components/shared-script-editor";
import { WarningPanel } from "../../../../../../components/shared-script-editor";
import { DiagnosticTooltip } from "../../../../../../components/shared-script-editor";
import { useDiagnosticTooltip } from "../../../../../../components/shared-script-editor";
import { DETAIL_COLORS_HEX } from "../../../../../../components/shared-script-editor";
import { sanitizeHtml } from "../../../../../../lib/client-security";
import { Cpu } from "lucide-react";

interface CampaignScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  isMobile: boolean;
  onRun?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

const LINE_HEIGHT_CAMPAIGN = 24;

export function CampaignScriptEditor({
  value,
  onChange,
  isMobile,
  onRun,
  readOnly,
  placeholder,
  className,
}: CampaignScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const { syntaxValid, validateSyntax, warnings, diagnostics } = useParserWorker();
  const [showWarnings, setShowWarnings] = useState(false);
  
  const { suggestions, activeIdx, caretXY, handleChange, handleKeyDown, acceptSuggestion, clearSuggestions, handleApplyDiagnosticFix } = useAutocomplete(
    onChange, 
    () => {}, 
    textareaRef, 
    validateSyntax,
    diagnostics,
  );
  const { tooltipState, onHighlightMouseMove, onHighlightMouseLeave, onTooltipMouseEnter, onTooltipMouseLeave, hideTooltip } = useDiagnosticTooltip(diagnostics);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const warningCount = warnings.length;
  const diagCount = diagnostics.length;
  
  // Custom keydown wrapper to support onRun
  const onKeyDownWrapper = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun?.();
      return;
    }
    handleKeyDown(e);
  }, [handleKeyDown, onRun]);

  const displayPlaceholder = !value && placeholder;
  const overlayText = displayPlaceholder ? placeholder : value || " ";

  return (
    <div className={`relative flex flex-col gap-3 grow overflow-visible ${className || ''}`}>
      <div className="relative grow flex flex-col border border-accent/20 bg-bg-primary/50 rounded-xl overflow-visible group min-h-0 shadow-[inset_0_0_32px_rgba(var(--accent-rgb),0.035)]">
        <div className="flex-1 min-h-0 relative overflow-hidden rounded-xl">
          <div 
            ref={highlightRef} 
            className={`absolute inset-0 p-3 pt-4 font-mono leading-[24px] overflow-hidden ${displayPlaceholder ? 'text-accent/25' : 'text-accent'}`}
            style={{ fontSize: isMobile ? '12px' : '14px', tabSize: 2, pointerEvents: 'auto' }}
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(displayPlaceholder 
                ? highlightCode(overlayText, {
                    keywordClass: 'text-inherit opacity-50',
                    commandClass: 'text-inherit opacity-50',
                    controlClass: 'text-inherit opacity-50',
                    identifierClass: 'text-inherit opacity-50',
                    functionClass: 'text-inherit opacity-50',
                    lineNumberColor: 'rgba(var(--accent-rgb),0.15)',
                    lineNumberWidth: '44px',
                    lineHeight: LINE_HEIGHT_CAMPAIGN,
                    lineNumberPaddingRight: '12px',
                    lineNumberMarginRight: '0px',
                    borderColor: 'rgba(var(--accent-rgb),0.05)',
                    commentColor: 'inherit'
                  }) 
                : highlightCode(value, { 
                    keywordClass: 'text-[color:var(--sem-warning)] drop-shadow-[0_0_5px_rgba(var(--sem-warning-rgb),0.5)]', 
                    lineNumberColor: 'rgba(var(--accent-rgb),0.3)', 
                    lineNumberWidth: '44px', 
                    lineHeight: LINE_HEIGHT_CAMPAIGN, 
                    lineNumberPaddingRight: '12px', 
                    lineNumberMarginRight: '0px', 
                    borderColor: 'rgba(var(--accent-rgb),0.1)',
                    diagnostics,
                  })
              ) 
            }} 
          />
          <textarea 
            title="script editor" 
            ref={textareaRef} 
            onScroll={handleScroll} 
            onMouseMove={onHighlightMouseMove}
            onMouseLeave={onHighlightMouseLeave}
            className="absolute inset-0 z-20 w-full h-full p-3 pt-4 font-mono leading-[24px] text-transparent caret-accent bg-transparent resize-none outline-none transition-colors custom-scrollbar selection:bg-accent/30 selection:text-transparent" 
            style={{ 
              paddingLeft: "56px", 
              fontSize: isMobile ? '12px' : '14px', 
              tabSize: 2
            }} 
            spellCheck={false} 
            value={value} 
            onChange={(e) => {
              handleChange(e);
            }} 
            onKeyDown={onKeyDownWrapper} 
            onBlur={() => setTimeout(clearSuggestions, 150)}
            disabled={readOnly}
          />
        </div>
        
        {/* Top Right Status Area */}
        <div className="absolute top-2 right-4 z-30 flex items-center gap-2 text-[10px] tracking-[0.3em] font-black pointer-events-none select-none">
          <span className="text-accent/70 hidden md:inline">[ALISCRIPT_V2]</span>
          {syntaxValid === false && <span className="text-red-500 drop-shadow-[0_0_5px_rgba(var(--sem-danger-rgb),0.8)] animate-pulse">SYNTAX_ERR</span>}
          {diagCount > 0 && (
            <span className="text-red-400/70 text-[9px] tracking-[0.15em]">
              {diagCount} {diagCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
          {warningCount > 0 && (
            <button
              type="button"
              aria-label={`${warningCount} semantic warning${warningCount > 1 ? 's' : ''}`}
              className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/30 border border-amber-500/40 text-amber-400 text-[9px] tracking-[0.15em] font-bold cursor-pointer hover:bg-amber-800/40 hover:border-amber-400 transition-all animate-pulse"
              onClick={() => setShowWarnings(!showWarnings)}
            >
              <Cpu className="w-3 h-3" />
              {warningCount}
            </button>
          )}
        </div>

        <AutocompleteDropdown 
          suggestions={suggestions} 
          activeIdx={activeIdx} 
          caretXY={caretXY} 
          onAccept={acceptSuggestion} 
          detailColors={DETAIL_COLORS_HEX} 
          useTop={true} 
        />
        
        {showWarnings && warningCount > 0 && (
          <WarningPanel warnings={warnings} onClose={() => setShowWarnings(false)} />
        )}

        <DiagnosticTooltip
          visible={tooltipState.visible}
          x={tooltipState.x}
          y={tooltipState.y}
          marker={tooltipState.marker}
          onMouseEnter={onTooltipMouseEnter}
          onMouseLeave={onTooltipMouseLeave}
          onApplyFix={(diag) => {
            handleApplyDiagnosticFix(diag);
            hideTooltip();
          }}
        />

        <div className="flex items-center justify-between border-t border-accent/10 bg-accent/[0.025] px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-accent/70 rounded-b-xl">
          <span>{Math.max(value.split("\n").length, 1)} Lines</span>
          <span>{value.length} Chars</span>
        </div>
      </div>
    </div>
  );
}
