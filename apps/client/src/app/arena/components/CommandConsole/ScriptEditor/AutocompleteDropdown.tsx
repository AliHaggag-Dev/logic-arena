import React from 'react';
import { Suggestion, CaretPosition } from './types';
import { DETAIL_COLORS } from './constants';

interface AutocompleteDropdownProps {
    suggestions: Suggestion[];
    activeIdx: number;
    caretXY: CaretPosition;
    onAccept: (suggestion: Suggestion) => void;
}

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({ suggestions, activeIdx, caretXY, onAccept }) => {
    if (suggestions.length === 0) return null;

    return (
        <div
            className="absolute z-50 font-mono text-[11px] bg-black/95 border border-cyan-700/60 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(34,211,238,0.1)] overflow-hidden backdrop-blur-md min-w-70"
            style={{ bottom: caretXY.bottom, left: caretXY.left }}
        >
            <div className="px-3 py-1.5 border-b border-cyan-900/40 flex items-center gap-2">
                <span className="text-cyan-600/60 text-[10px] tracking-widest uppercase">ALISCRIPT INTELLISENSE</span>
            </div>
            {suggestions.map((s, i) => (
                <button
                    key={s.label}
                    type="button"
                    onMouseDown={() => onAccept(s)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors ${i === activeIdx ? 'bg-cyan-950/80 text-white' : 'text-cyan-300 hover:bg-cyan-950/40'}`}
                >
                    <span
                        className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ color: DETAIL_COLORS[s.detail] ?? '#888', border: `1px solid ${DETAIL_COLORS[s.detail] ?? '#888'}44` }}
                    >
                        {s.detail}
                    </span>
                    <span className="font-bold">{s.label}</span>
                    <span className="ml-auto text-[10px] text-cyan-600/60 truncate">{s.hint}</span>
                </button>
            ))}
            <div className="px-3 py-1 border-t border-cyan-900/30 text-[10px] text-cyan-700/50 flex gap-3">
                <span>↑↓ Navigate</span><span>Tab / Enter Accept</span><span>Esc Dismiss</span>
            </div>
        </div>
    );
};
