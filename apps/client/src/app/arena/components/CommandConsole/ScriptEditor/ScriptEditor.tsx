import React, { useRef, useCallback } from "react";
import { ScriptEditorProps } from "./types";
import { highlightCode } from "./highlight";
import { useParserWorker } from "./useParserWorker";
import { useAutocomplete } from "./useAutocomplete";
import { AutocompleteDropdown } from "./AutocompleteDropdown";

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ scriptInput, setScriptInput, handleDeployBrain, toggleLibrary, clearPrebuilt }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const { syntaxValid, validateSyntax } = useParserWorker();
    const { suggestions, activeIdx, caretXY, handleChange, handleKeyDown, acceptSuggestion, clearSuggestions } = useAutocomplete(
        setScriptInput, clearPrebuilt, textareaRef, validateSyntax
    );

    const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
        if (highlightRef.current) {
            highlightRef.current.scrollTop = e.currentTarget.scrollTop;
            highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    }, []);

    return (
        <div className="relative flex flex-col gap-3 grow overflow-visible">
            <div className="relative grow flex flex-col border border-cyan-900/40 bg-black/50 rounded-lg overflow-visible group min-h-0">
                <div className="flex-1 min-h-0 relative overflow-hidden rounded-lg">
                    <div ref={highlightRef} className="absolute inset-0 p-3 pt-4 pointer-events-none font-mono text-[13px] leading-5 text-cyan-300 overflow-hidden" dangerouslySetInnerHTML={{ __html: highlightCode(scriptInput) }} />
                    <textarea title="script editor" ref={textareaRef} onScroll={handleScroll} className="relative w-full h-full p-3 pt-4 font-mono text-[13px] leading-5 text-transparent caret-purple-500 bg-transparent resize-none outline-none group-focus-within:border-cyan-500/50 transition-colors custom-scrollbar" style={{ paddingLeft: "56px" }} spellCheck={false} value={scriptInput} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={() => setTimeout(clearSuggestions, 150)} />
                </div>
                <div className="absolute top-2 right-4 text-[10px] text-cyan-600/50 tracking-[0.3em] font-black pointer-events-none select-none">
                    [ALISCRIPT_V2] {syntaxValid === false && <span className="text-red-500 ml-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">SYNTAX_ERR</span>}
                </div>
                <AutocompleteDropdown suggestions={suggestions} activeIdx={activeIdx} caretXY={caretXY} onAccept={acceptSuggestion} />
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
