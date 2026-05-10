import React, { useRef, useCallback, useState } from "react";
import { ScriptEditorProps } from "./types";
import { highlightCode } from "./highlight";
import { useParserWorker } from "./useParserWorker";
import { useAutocomplete } from "./useAutocomplete";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { WarningPanel } from "./WarningPanel";
import { sanitizeHtml } from "../../../../../lib/client-security";

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ scriptInput, setScriptInput, handleDeployBrain, toggleLibrary, clearPrebuilt }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const { syntaxValid, validateSyntax, warnings } = useParserWorker();
    const [showWarnings, setShowWarnings] = useState(false);
    const { suggestions, activeIdx, caretXY, handleChange, handleKeyDown, acceptSuggestion, clearSuggestions } = useAutocomplete(
        setScriptInput, clearPrebuilt, textareaRef, validateSyntax
    );

    const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
        if (highlightRef.current) {
            highlightRef.current.scrollTop = e.currentTarget.scrollTop;
            highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    }, []);

    const warningCount = warnings.length;

    return (
        <div className="relative flex flex-col gap-3 grow overflow-visible">
            <div className="relative grow flex flex-col border border-cyan-900/40 bg-black/50 rounded-lg overflow-visible group min-h-0">
                <div className="flex-1 min-h-0 relative overflow-hidden rounded-lg">
                    <div ref={highlightRef} className="absolute inset-0 p-3 pt-4 pointer-events-none font-mono text-[13px] leading-5 text-cyan-300 overflow-hidden" dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightCode(scriptInput)) }} />
                    <textarea title="script editor" ref={textareaRef} onScroll={handleScroll} className="relative w-full h-full p-3 pt-4 font-mono text-[13px] leading-5 text-transparent caret-purple-500 bg-transparent resize-none outline-none group-focus-within:border-cyan-500/50 transition-colors custom-scrollbar" style={{ paddingLeft: "56px" }} spellCheck={false} value={scriptInput} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={() => setTimeout(clearSuggestions, 150)} />
                </div>
                <div className="absolute top-2 right-4 flex items-center gap-2 text-[10px] tracking-[0.3em] font-black pointer-events-none select-none">
                    <span className="text-cyan-600/50">[ALISCRIPT_V2]</span>
                    {syntaxValid === false && <span className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">SYNTAX_ERR</span>}
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
                <AutocompleteDropdown suggestions={suggestions} activeIdx={activeIdx} caretXY={caretXY} onAccept={acceptSuggestion} />
                {showWarnings && warningCount > 0 && (
                    <WarningPanel warnings={warnings} onClose={() => setShowWarnings(false)} />
                )}
            </div>
            <div className="flex gap-3 shrink-0">
                <button type="button" onClick={handleDeployBrain} className="flex-1 py-3 bg-purple-900/20 border border-purple-500/50 text-purple-300 font-black text-[10px] hover:bg-purple-600/40 hover:border-purple-400 hover:text-white transition-all rounded uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.15)] group relative overflow-hidden">
                    <span className="relative z-10">Upload Script</span><div className="absolute inset-0 bg-purple-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button type="button" onClick={toggleLibrary} className="flex-1 py-3 bg-cyan-900/20 border border-cyan-700/50 text-cyan-400 font-black text-[10px] hover:bg-cyan-800/40 hover:border-cyan-400 transition-all rounded uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.1)] group relative overflow-hidden">
                    <span className="relative z-10">Script Guide</span><div className="absolute inset-0 bg-cyan-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};
