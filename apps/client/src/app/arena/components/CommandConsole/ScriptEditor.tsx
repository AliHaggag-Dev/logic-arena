import React, { useState, useEffect, useRef } from "react";

// Synchronous syntax highlighter for the overlay.
const highlightCode = (code: string) => {
    const keywords = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FUNCTION", "CALL", "FIRE", "BURST_FIRE", "MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "SET", "NOT", "TRUE", "FALSE", "WAIT", "SCAN"];
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    
    const lines = code.split('\n');
    return lines.map((line, i) => {
        const highlighted = line.replace(regex, (match) => `<span class="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">${match}</span>`);
        return `<div style="display: flex; min-height: 20px;"><span style="box-sizing: border-box; user-select: none; color: rgba(8, 145, 178, 0.5); text-align: right; width: 32px; border-right: 1px solid rgba(8, 145, 178, 0.4); padding-right: 8px; margin-right: 12px; flex-shrink: 0;">${i + 1}</span><span style="white-space: pre-wrap; word-break: break-all;">${highlighted || ' '}</span></div>`;
    }).join("");
};

// ── Intellisense autocomplete config ─────────────────────────────────────
const AUTOCOMPLETE_SUGGESTIONS = [
    // Commands
    { label: 'MOVE',            detail: 'command',    hint: 'Move forward at standard speed' },
    { label: 'MOVE_FAST',       detail: 'command',    hint: 'Move forward at 2× speed' },
    { label: 'STOP',            detail: 'command',    hint: 'Halt all movement' },
    { label: 'BACKUP',          detail: 'command',    hint: 'Move in reverse' },
    { label: 'PATHFIND',        detail: 'command',    hint: 'A* pathfind toward target' },
    { label: 'FIRE',            detail: 'command',    hint: 'Single shot at nearest enemy' },
    { label: 'BURST_FIRE',      detail: 'command',    hint: 'Multi-shot burst at enemy' },
    { label: 'SCAN',            detail: 'command',    hint: 'Rotate FOV cone +15°' },
    { label: 'WAIT',            detail: 'command',    hint: 'Pause execution for N ticks' },
    // Control Flow
    { label: 'IF',              detail: 'control',    hint: 'Conditional branch' },
    { label: 'WHILE',           detail: 'control',    hint: 'Loop while condition is true' },
    { label: 'FUNCTION',        detail: 'control',    hint: 'Define a reusable function' },
    { label: 'CALL',            detail: 'control',    hint: 'Call a function by name' },
    { label: 'SET',             detail: 'control',    hint: 'Assign a variable' },
    // Identifiers (readable)
    { label: 'rotation',        detail: 'identifier', hint: 'Body facing angle (radians). Writable.' },
    { label: 'angle',           detail: 'identifier', hint: 'Alias for rotation' },
    { label: 'rot',             detail: 'identifier', hint: 'Alias for rotation' },
    { label: 'fovDirection',    detail: 'identifier', hint: 'Scanner facing angle (radians). Independent from body.' },
    { label: 'lockVision',      detail: 'flag',       hint: 'SET to TRUE to lock scanner to body rotation' },
    { label: 'energy',          detail: 'identifier', hint: 'Alias – use MY_ENERGY' },
    { label: 'distance',        detail: 'identifier', hint: 'Distance to nearest VISIBLE enemy' },
    { label: 'health',          detail: 'identifier', hint: 'Current robot HP (0–100)' },
    { label: 'MY_ENERGY',       detail: 'identifier', hint: 'Current energy (0–1000)' },
    { label: 'ENERGY_PCT',      detail: 'identifier', hint: 'Energy as percentage (0–100)' },
    { label: 'IN_STASIS',       detail: 'identifier', hint: 'True when energy ≤ 0' },
    { label: 'CAN_SEE_ENEMY',   detail: 'identifier', hint: 'True if enemy is in FOV cone' },
    { label: 'spotted',         detail: 'identifier', hint: 'Alias for CAN_SEE_ENEMY' },
    { label: 'NEAREST_VISIBLE_X', detail: 'identifier', hint: 'X of nearest visible enemy' },
    { label: 'NEAREST_VISIBLE_Y', detail: 'identifier', hint: 'Y of nearest visible enemy' },
];

const DETAIL_COLORS: Record<string, string> = {
    command:    '#22d3ee',
    control:    '#f59e0b',
    identifier: '#a855f7',
    flag:       '#4ade80',
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [syntaxValid, setSyntaxValid] = useState<boolean | null>(null);
    const [suggestions, setSuggestions] = useState<typeof AUTOCOMPLETE_SUGGESTIONS>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [caretXY, setCaretXY] = useState({ top: 0, left: 56 });

    useEffect(() => {
        workerRef.current = new Worker(new URL('../../../../workers/parser.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e) => {
            if (e.data.status === "success") setSyntaxValid(true);
            else setSyntaxValid(false);
        };
        return () => workerRef.current?.terminate();
    }, []);

    /** Get the partial word the cursor is currently on */
    const getCurrentWord = (textarea: HTMLTextAreaElement): string => {
        const pos = textarea.selectionStart;
        const text = textarea.value.slice(0, pos);
        const match = text.match(/[a-zA-Z_][a-zA-Z_0-9]*$/);
        return match ? match[0] : '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setScriptInput(val);
        clearPrebuilt();
        workerRef.current?.postMessage({ code: val, id: Date.now() });

        const word = getCurrentWord(e.target);
        if (word.length >= 1) {
            const filtered = AUTOCOMPLETE_SUGGESTIONS.filter(s =>
                s.label.toLowerCase().startsWith(word.toLowerCase()) && s.label.toLowerCase() !== word.toLowerCase()
            );
            setSuggestions(filtered.slice(0, 8));
            setActiveIdx(0);

            // Compute caret position — place dropdown 34px BELOW the current line
            // so it never overlaps the text being typed
            const ta = e.target;
            const linesBefore = ta.value.slice(0, ta.selectionStart).split('\n');
            const lineIdx = linesBefore.length - 1;
            const LINE_HEIGHT = 20;
            setCaretXY({ top: lineIdx * LINE_HEIGHT + 28 + 34, left: 56 });
        } else {
            setSuggestions([]);
        }
    };

    const acceptSuggestion = (suggestion: typeof AUTOCOMPLETE_SUGGESTIONS[0]) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const pos = ta.selectionStart;
        const textBefore = ta.value.slice(0, pos);
        const wordMatch = textBefore.match(/[a-zA-Z_][a-zA-Z_0-9]*$/);
        const wordLen = wordMatch ? wordMatch[0].length : 0;

        const newVal =
            ta.value.slice(0, pos - wordLen) +
            suggestion.label +
            ta.value.slice(pos);

        setScriptInput(newVal);
        setSuggestions([]);

        // Re-focus and move cursor after the inserted word
        setTimeout(() => {
            ta.focus();
            const newPos = pos - wordLen + suggestion.label.length;
            ta.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Tab' || e.key === 'Enter') {
            if (suggestions[activeIdx]) {
                e.preventDefault();
                acceptSuggestion(suggestions[activeIdx]);
            }
        } else if (e.key === 'Escape') {
            setSuggestions([]);
        }
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
                    ref={textareaRef}
                    className="absolute inset-0 w-full h-full p-3 pt-4 font-mono text-[13px] leading-[20px] text-transparent caret-purple-500 bg-transparent resize-none outline-none group-focus-within:border-cyan-500/50 transition-colors custom-scrollbar"
                    style={{ paddingLeft: "56px" }}
                    spellCheck={false}
                    value={scriptInput}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                />
                {/* Watermark */}
                <div className="absolute top-2 right-4 text-[10px] text-cyan-600/50 tracking-[0.3em] font-black pointer-events-none select-none">
                    [ALISCRIPT_V2] {syntaxValid === false && <span className="text-red-500 ml-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">SYNTAX_ERR</span>}
                </div>

                {/* ── Autocomplete Dropdown ───────────────────────────────────────── */}
                {suggestions.length > 0 && (
                    <div
                        className="absolute z-50 font-mono text-[11px] bg-black/95 border border-cyan-700/60 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(34,211,238,0.1)] overflow-hidden backdrop-blur-md min-w-[280px]"
                        style={{ top: caretXY.top, left: caretXY.left }}
                    >
                        <div className="px-3 py-1.5 border-b border-cyan-900/40 flex items-center gap-2">
                            <span className="text-cyan-600/60 text-[9px] tracking-widest uppercase">ALISCRIPT INTELLISENSE</span>
                        </div>
                        {suggestions.map((s, i) => (
                            <button
                                key={s.label}
                                type="button"
                                onMouseDown={() => acceptSuggestion(s)}
                                className={`w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors ${i === activeIdx ? 'bg-cyan-950/80 text-white' : 'text-cyan-300 hover:bg-cyan-950/40'}`}
                            >
                                <span
                                    className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                    style={{ color: DETAIL_COLORS[s.detail] ?? '#888', border: `1px solid ${DETAIL_COLORS[s.detail] ?? '#888'}44` }}
                                >
                                    {s.detail}
                                </span>
                                <span className="font-bold">{s.label}</span>
                                <span className="ml-auto text-[10px] text-cyan-600/60 truncate">{s.hint}</span>
                            </button>
                        ))}
                        <div className="px-3 py-1 border-t border-cyan-900/30 text-[9px] text-cyan-700/50 flex gap-3">
                            <span>↑↓ Navigate</span><span>Tab / Enter Accept</span><span>Esc Dismiss</span>
                        </div>
                    </div>
                )}
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