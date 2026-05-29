"use client";

import React, { useRef, useCallback, useState } from "react";
import { highlightCode } from "../../../../../components/shared-script-editor";
import { useParserWorker } from "../../../../../components/shared-script-editor";
import { useAutocompleteFast } from "../../../../../components/shared-script-editor";
import { AutocompleteDropdown } from "../../../../../components/shared-script-editor";
import { WarningPanel } from "../../../../../components/shared-script-editor";
import { DiagnosticTooltip } from "../../../../../components/shared-script-editor";
import { useDiagnosticTooltip } from "../../../../../components/shared-script-editor";
import { DETAIL_COLORS_HEX, LINE_HEIGHT_CAMPAIGN } from "../../../../../components/shared-script-editor";
import { sanitizeHtml } from "../../../../../lib/client-security";

interface EditScriptEditorProps {
    content: string;
    setContent: (content: string) => void;
}

export function EditScriptEditor({ content, setContent }: EditScriptEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const { syntaxValid, validateSyntax, warnings, diagnostics } = useParserWorker();
    const [showWarnings, setShowWarnings] = useState(false);
    const { suggestions, activeIdx, caretXY, handleChange, handleKeyDown: autoKeyDown, acceptSuggestion, clearSuggestions, handleApplyDiagnosticFix } = useAutocompleteFast(
        setContent, () => {}, textareaRef, validateSyntax, diagnostics
    );
    const { tooltipState, onHighlightMouseMove, onHighlightMouseLeave, onTooltipMouseEnter, onTooltipMouseLeave, hideTooltip } = useDiagnosticTooltip(diagnostics);

    const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
        if (highlightRef.current) {
            highlightRef.current.scrollTop = e.currentTarget.scrollTop;
            highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        autoKeyDown(e);
    }, [autoKeyDown]);

    const warningCount = warnings.length;
    const diagCount = diagnostics.length;

    return (
        <div className="relative flex flex-col flex-1 min-h-0 overflow-visible m-3">
            <div className="relative flex-1 flex flex-col border border-accent/10 bg-bg-primary rounded-lg overflow-visible group min-h-0">
                <div className="flex-1 min-h-0 relative overflow-hidden rounded-lg">
                    <div
                        ref={highlightRef}
                        className="absolute inset-0 p-4 font-mono text-[0.8125rem] leading-6 text-text-primary overflow-hidden"
                        style={{ pointerEvents: 'auto' }}
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(highlightCode(content, {
                                commandClass: 'text-[var(--sem-info)] drop-shadow-[0_0_4px_rgba(var(--sem-info-rgb),0.5)]',
                                controlClass: 'text-[var(--sem-warning)] drop-shadow-[0_0_4px_rgba(var(--sem-warning-rgb),0.5)]',
                                functionClass: 'text-[var(--accent)] drop-shadow-[0_0_4px_rgba(var(--accent-rgb),0.65)]',
                                identifierClass: 'text-[var(--sem-success)] drop-shadow-[0_0_4px_rgba(var(--sem-success-rgb),0.5)]',
                                lineNumberColor: 'rgba(var(--accent-rgb), 0.45)',
                                lineNumberWidth: '32px',
                                lineHeight: LINE_HEIGHT_CAMPAIGN,
                                lineNumberPaddingRight: '8px',
                                lineNumberMarginRight: '12px',
                                borderColor: 'rgba(var(--accent-rgb), 0.2)',
                                diagnostics,
                            }))
                        }}
                    />
                    <textarea
                        ref={textareaRef}
                        title="script editor"
                        onScroll={handleScroll}
                        onMouseMove={onHighlightMouseMove}
                        onMouseLeave={onHighlightMouseLeave}
                        className="relative w-full h-full p-4 font-mono text-[0.8125rem] leading-6 text-transparent caret-accent bg-transparent resize-none outline-none group-focus-within:border-accent/50 transition-colors custom-scrollbar selection:bg-accent/20"
                        style={{ paddingLeft: "60px" }}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        aria-label="Script content editor"
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setTimeout(clearSuggestions, 150)}
                    />
                </div>
                <div className="absolute top-2 right-4 flex items-center gap-2 text-[10px] tracking-[0.3em] font-black pointer-events-none select-none">
                    <span className="text-accent/30">[ALISCRIPT_V2]</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            {warningCount}
                        </button>
                    )}
                </div>
                <AutocompleteDropdown suggestions={suggestions} activeIdx={activeIdx} caretXY={caretXY} onAccept={acceptSuggestion} detailColors={DETAIL_COLORS_HEX} useTop={false} />
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
            </div>
        </div>
    );
}

