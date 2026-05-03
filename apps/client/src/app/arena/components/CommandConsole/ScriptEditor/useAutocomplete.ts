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
    const [caretXY, setCaretXY] = useState<CaretPosition>({ bottom: 0, left: 56 });

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
            const linesBefore = ta.value.slice(0, ta.selectionStart).split('\n');
            const totalLines = ta.value.split('\n').length;
            const lineIdx = linesBefore.length - 1;
            const linesBelow = totalLines - lineIdx - 1;
            setCaretXY({ bottom: linesBelow * LINE_HEIGHT + 28 + 4, left: 56 });
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
