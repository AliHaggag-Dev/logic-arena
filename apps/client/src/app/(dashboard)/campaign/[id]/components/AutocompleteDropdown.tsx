import React, { useRef, useEffect } from 'react';
import { Suggestion, CaretPosition } from './types';
import { DETAIL_COLORS } from './constants';

interface AutocompleteDropdownProps {
    suggestions: Suggestion[];
    activeIdx: number;
    caretXY: CaretPosition;
    onAccept: (suggestion: Suggestion) => void;
}

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({ suggestions, activeIdx, caretXY, onAccept }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (activeItemRef.current && listRef.current) {
            activeItemRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIdx]);

    if (suggestions.length === 0) return null;

    return (
        <div
            className="absolute z-50 font-mono text-[11px] bg-bg-secondary border border-accent/40 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(var(--accent-rgb),0.1)] overflow-hidden backdrop-blur-md w-[380px] max-w-[calc(100vw-32px)] flex flex-col"
            style={{ bottom: caretXY.bottom, top: caretXY.top, left: caretXY.left, maxHeight: '250px' }}
        >
            <div className="px-3 py-1.5 border-b border-accent/20 flex items-center gap-2 shrink-0">
                <span className="text-accent/60 text-[10px] tracking-widest uppercase">ALISCRIPT INTELLISENSE</span>
            </div>
            <div ref={listRef} className="overflow-y-auto flex-1 custom-scrollbar">
            {suggestions.map((s, i) => (
                <button
                    key={s.label}
                    ref={i === activeIdx ? activeItemRef : null}
                    type="button"
                    onMouseDown={() => onAccept(s)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors overflow-hidden ${i === activeIdx ? 'bg-accent/20 text-text-primary' : 'text-text-secondary hover:bg-accent/10'}`}
                >
                    <span
                        className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ color: DETAIL_COLORS[s.detail] ?? 'var(--text-secondary)', border: `1px solid color-mix(in srgb, ${DETAIL_COLORS[s.detail] ?? 'var(--text-secondary)'} 30%, transparent)` }}
                    >
                        {s.detail}
                    </span>
                    <span className="font-bold shrink-0">{s.label}</span>
                    <span className="ml-auto text-[10px] text-text-secondary/60 truncate min-w-0">{s.hint}</span>
                </button>
            ))}
            </div>
            <div className="px-3 py-1 border-t border-accent/20 text-[10px] text-accent/50 flex gap-3 shrink-0 bg-bg-secondary">
                <span>↑↓ Navigate</span><span>Tab / Enter Accept</span><span>Esc Dismiss</span>
            </div>
        </div>
    );
};
