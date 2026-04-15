import React, { useState, useEffect, useRef } from "react";

// Synchronous syntax highlighter for the overlay.
const highlightCode = (code: string) => {
    const keywords = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FUNCTION", "CALL", "FIRE", "BURST_FIRE", "MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "SET", "NOT", "TRUE", "FALSE", "WAIT", "SCAN"];
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    
    const lines = code.split('\n');
    return lines.map((line, i) => {
        const highlighted = line.replace(regex, (match) => `<span class="text-purple-400 font-black drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">${match}</span>`);
        // Using inline styling to perfectly sync pixel offsets
        return `<div style="display: flex; min-height: 20px;"><span style="user-select: none; color: rgba(8, 145, 178, 0.5); text-align: right; width: 32px; border-right: 1px solid rgba(8, 145, 178, 0.4); padding-right: 8px; margin-right: 12px; flex-shrink: 0;">${i + 1}</span><span style="white-space: pre-wrap; word-break: break-all;">${highlighted}</span></div>`;
    }).join("");
};

interface ScriptEditorProps {
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: () => void;
    toggleLibrary: () => void;
    clearPrebuilt: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ scriptInput, setScriptInput, handleDeployBrain, toggleLibrary, clearPrebuilt }) => {
    const workerRef = useRef<Worker | null>(null);
    const [syntaxValid, setSyntaxValid] = useState<boolean | null>(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../../../../workers/parser.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e) => {
            if (e.data.status === "success") setSyntaxValid(true);
            else setSyntaxValid(false);
        };
        return () => workerRef.current?.terminate();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setScriptInput(val);
        clearPrebuilt();
        workerRef.current?.postMessage({ code: val, id: Date.now() });
    };

    return (
        <div className="relative flex flex-col gap-3 flex-grow overflow-hidden">
            <div className="relative flex-grow flex flex-col border border-cyan-900/40 bg-black/50 rounded-lg overflow-hidden group">
                {/* Visual Overlay */}
                <div 
                    className="absolute inset-0 p-3 pt-4 pointer-events-none font-mono text-[13px] leading-[20px] text-cyan-300 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: highlightCode(scriptInput) }}
                />
                <textarea
                    className="absolute inset-0 w-full h-full p-3 pt-4 font-mono text-[13px] leading-[20px] text-transparent caret-purple-500 bg-transparent resize-none outline-none group-focus-within:border-cyan-500/50 transition-colors custom-scrollbar"
                    style={{ paddingLeft: "64px" }}
                    spellCheck={false}
                    value={scriptInput}
                    onChange={handleChange}
                />
                {/* Watermark anchored to top right */}
                <div className="absolute top-2 right-4 text-[10px] text-cyan-600/50 tracking-[0.3em] font-black pointer-events-none select-none">
                    [ALISCRIPT_V2] {syntaxValid === false && <span className="text-red-500 ml-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">SYNTAX_ERR</span>}
                </div>
            </div>
            <div className="flex gap-3 shrink-0">
                <button
                    type="button"
                    onClick={handleDeployBrain}
                    className="flex-1 py-3 bg-purple-900/20 border border-purple-500/50 text-purple-300 font-black text-[10px] hover:bg-purple-600/40 hover:border-purple-400 hover:text-white transition-all rounded uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.15)] group relative overflow-hidden"
                >
                    <span className="relative z-10">Deploy Brain</span>
                    <div className="absolute inset-0 bg-purple-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button
                    type="button"
                    onClick={toggleLibrary}
                    className="flex-1 py-3 bg-cyan-900/20 border border-cyan-700/50 text-cyan-400 font-black text-[10px] hover:bg-cyan-800/40 hover:border-cyan-400 transition-all rounded uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.1)] group relative overflow-hidden"
                >
                    <span className="relative z-10">Neural Handbook</span>
                     <div className="absolute inset-0 bg-cyan-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};