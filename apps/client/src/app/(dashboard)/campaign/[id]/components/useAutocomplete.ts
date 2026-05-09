import { useState, RefObject } from 'react';
import { Suggestion, CaretPosition } from './types';
import { AUTOCOMPLETE_SUGGESTIONS, LINE_HEIGHT } from './constants';

export const useAutocomplete = (
    setScriptInput: (val: string) => void,
    clearPrebuilt: () => void,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
    validateSyntax: (code: string) => void
) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [caretXY, setCaretXY] = useState<CaretPosition>({ top: 0, left: 56 });

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
        validateSyntax(val);

        const word = getCurrentWord(e.target);
        if (word.length >= 1) {
            const filtered = AUTOCOMPLETE_SUGGESTIONS.filter(s =>
                s.label.toLowerCase().startsWith(word.toLowerCase()) && s.label.toLowerCase() !== word.toLowerCase()
            );
            setSuggestions(filtered);
            setActiveIdx(0);

            const ta = e.target;
            const pos = ta.selectionStart;
            
            // Create shadow div to calculate precise caret coordinates
            const div = document.createElement('div');
            const style = window.getComputedStyle(ta);
            
            // Explicitly copy critical styles for perfect wrapping match
            const propsToCopy = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'borderWidth', 'boxSizing', 'wordBreak', 'whiteSpace', 'letterSpacing', 'tabSize'];
            for (const prop of propsToCopy) {
                div.style[prop as any] = style[prop as any];
            }
            div.style.width = `${ta.offsetWidth}px`;
            div.style.position = 'absolute';
            div.style.visibility = 'hidden';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-all';
            
            // Replicate content up to cursor
            const textBefore = ta.value.substring(0, pos);
            div.textContent = textBefore;
            
            // Add a span to get exact coordinates
            const span = document.createElement('span');
            span.textContent = ta.value.substring(pos) || '.';
            div.appendChild(span);
            document.body.appendChild(div);
            
            const spanRect = span.getBoundingClientRect();
            const divRect = div.getBoundingClientRect();
            
            // Calculate relative to textarea
            const caretTopInside = spanRect.top - divRect.top;
            const top = caretTopInside - ta.scrollTop + ta.offsetTop;
            let left = spanRect.left - divRect.left - ta.scrollLeft + ta.offsetLeft;
            
            // Prevent horizontal overflow (dropdown is ~380px wide)
            const maxLeft = ta.offsetWidth - 385;
            if (left > maxLeft) {
                left = Math.max(0, maxLeft);
            }
            
            document.body.removeChild(div);
            
            // Smart vertical positioning
            const spaceBelow = ta.offsetHeight - top;
            const dropdownHeight = 250;
            
            if (spaceBelow < dropdownHeight && top > dropdownHeight) {
                // Not enough space below, but enough space above -> Place ABOVE
                const bottomDist = ta.offsetHeight - top + 4;
                setCaretXY({ bottom: bottomDist, top: 'auto', left: left });
            } else {
                // Default: Place BELOW
                setCaretXY({ top: top + LINE_HEIGHT + 4, bottom: 'auto', left: left });
            }
        } else {
            setSuggestions([]);
        }
    };

    const acceptSuggestion = (suggestion: Suggestion) => {
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

    const clearSuggestions = () => setSuggestions([]);

    return {
        suggestions,
        activeIdx,
        caretXY,
        handleChange,
        handleKeyDown,
        acceptSuggestion,
        clearSuggestions
    };
};
