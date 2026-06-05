import React, { useRef, useCallback, useState } from "react";
import type { ScriptEditorProps } from "../../../../../components/shared-script-editor";
import { highlightCode } from "../../../../../components/shared-script-editor";
import { useParserWorker } from "../../../../../components/shared-script-editor";
import { useAutocompleteFast } from "../../../../../components/shared-script-editor";
import { AutocompleteDropdown } from "../../../../../components/shared-script-editor";
import { WarningPanel } from "../../../../../components/shared-script-editor";
import { DiagnosticTooltip } from "../../../../../components/shared-script-editor";
import { useDiagnosticTooltip } from "../../../../../components/shared-script-editor";
import { DETAIL_COLORS_HEX, LINE_HEIGHT_ARENA } from "../../../../../components/shared-script-editor";
import { sanitizeHtml } from "../../../../../lib/client-security";
import { AiGeneratePanel } from "../AiGeneratePanel";
import { Sparkles } from "lucide-react";

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ scriptInput, setScriptInput, handleDeployBrain, toggleLibrary, clearPrebuilt, isLibraryOpen }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const { syntaxValid, validateSyntax, warnings, diagnostics } = useParserWorker();
    const [showWarnings, setShowWarnings] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const { suggestions, activeIdx, caretXY, handleChange, handleKeyDown, acceptSuggestion, clearSuggestions, handleApplyDiagnosticFix } = useAutocompleteFast(
        setScriptInput, clearPrebuilt, textareaRef, validateSyntax, diagnostics
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

    return (
        <div className="relative flex flex-col gap-3 grow overflow-visible">
            <div className="relative grow flex flex-col border border-cyan-900/40 bg-black/50 rounded-lg overflow-visible group min-h-0">
                <div className="flex-1 min-h-0 relative overflow-hidden rounded-lg">
                    <div ref={highlightRef} className="absolute inset-0 p-3 pt-4 font-mono text-[13px] leading-5 text-cyan-300 overflow-hidden" style={{ pointerEvents: 'auto' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightCode(scriptInput, { keywordClass: 'text-purple-400 drop-shadow-[0_0_5px_rgba(var(--arena-purple-rgb),0.8)]', lineNumberColor: 'rgba(var(--arena-cyan-rgb),0.5)', lineNumberWidth: '32px', lineHeight: LINE_HEIGHT_ARENA, lineNumberPaddingRight: '8px', lineNumberMarginRight: '12px', borderColor: 'rgba(var(--arena-cyan-rgb),0.4)', diagnostics })) }} />
                    <textarea title="script editor" ref={textareaRef} onScroll={handleScroll} onMouseMove={onHighlightMouseMove} onMouseLeave={onHighlightMouseLeave} className="relative w-full h-full p-3 pt-4 font-mono text-[13px] leading-5 text-transparent caret-purple-500 bg-transparent resize-none outline-none group-focus-within:border-cyan-500/50 transition-colors custom-scrollbar" style={{ paddingLeft: "56px" }} spellCheck={false} value={scriptInput} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={() => setTimeout(clearSuggestions, 150)} />
                </div>
                {showGenerate && (
                    <div
                        className="absolute inset-0 z-40 flex flex-col overflow-hidden"
                        style={{
                            background: "rgba(var(--arena-black-rgb),0.92)",
                            backdropFilter: "blur(16px)",
                            borderRadius: "8px",
                            padding: "12px",
                            border: "1px solid rgba(var(--arena-purple-rgb),0.4)",
                        }}
                    >
                        <div className="flex justify-between items-center mb-3 border-b border-purple-900/30 pb-2 shrink-0">
                            <h4 className="text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Script Generator
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowGenerate(false)}
                                className="text-purple-400 hover:text-white text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20 hover:border-purple-400 transition-colors cursor-pointer"
                            >
                                CLOSE
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <AiGeneratePanel
                                isArena
                                onInsert={(code) => {
                                    setScriptInput(code);
                                    clearPrebuilt();
                                    setShowGenerate(false);
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="absolute top-2 right-4 flex items-center gap-2 text-[10px] tracking-[0.3em] font-black pointer-events-none select-none">
                    <span className="text-cyan-600/50 hidden md:inline">[ALISCRIPT_V2]</span>
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
                <AutocompleteDropdown
                    suggestions={suggestions}
                    activeIdx={activeIdx}
                    caretXY={caretXY}
                    onAccept={acceptSuggestion}
                    detailColors={DETAIL_COLORS_HEX}
                    useTop={caretXY.useTop !== false}
                    containerClass="absolute z-50 font-mono text-[11px] bg-[#0a0f1c] border border-[#22d3ee]/40 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(34,211,238,0.1)] overflow-hidden backdrop-blur-md w-[380px] max-w-[calc(100vw-32px)] flex flex-col"
                    headerClass="text-[#22d3ee]/60 text-[10px] tracking-widest uppercase"
                    activeItemClass="bg-[#22d3ee]/20 text-[#f8fafc]"
                    itemClass="text-[#9ca3af] hover:bg-[#22d3ee]/10"
                    footerClass="text-[#22d3ee]/50 bg-[#0a0f1c]"
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
            </div>
            <div className="flex gap-2 shrink-0">
                <button type="button" onClick={handleDeployBrain} className="flex-1 py-3 bg-purple-900/20 border border-purple-500/50 text-purple-300 font-black text-[10px] hover:bg-purple-600/40 hover:border-purple-400 hover:text-white transition-all rounded uppercase tracking-widest shadow-[0_0_15px_rgba(var(--arena-purple-rgb),0.15)] group relative overflow-hidden cursor-pointer">
                    <span className="relative z-10">Upload Script</span><div className="absolute inset-0 bg-purple-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button type="button" onClick={toggleLibrary} className={`flex-1 py-3 font-black text-[10px] transition-all rounded uppercase tracking-widest group relative overflow-hidden cursor-pointer ${isLibraryOpen ? 'bg-cyan-800/40 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(var(--arena-cyan-rgb),0.3)]' : 'bg-cyan-900/20 border border-cyan-700/50 text-cyan-400 hover:bg-cyan-800/40 hover:border-cyan-400 shadow-[0_0_10px_rgba(var(--arena-cyan-rgb),0.1)]'}`}>
                    <span className="relative z-10">Cookbook</span><div className="absolute inset-0 bg-cyan-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button
                    type="button"
                    onClick={() => setShowGenerate(!showGenerate)}
                    aria-label="Generate AliScript with ARIA AI"
                    aria-pressed={showGenerate}
                    className={`px-3 py-3 font-black text-[10px] transition-all rounded uppercase tracking-widest group relative overflow-hidden flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--arena-purple-rgb),0.15)] cursor-pointer ${
                        showGenerate
                            ? "bg-purple-500/25 border border-purple-500 text-purple-200"
                            : "bg-purple-950/20 border border-purple-500/30 text-purple-400/80 hover:bg-purple-600/30 hover:border-purple-400 hover:text-white"
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="relative z-10">AI</span>
                    <div className="absolute inset-0 bg-purple-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};

