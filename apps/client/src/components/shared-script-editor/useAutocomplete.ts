import { useState, RefObject } from 'react';
import type { Suggestion, CaretPosition } from './types';
import { AUTOCOMPLETE_SUGGESTIONS, LINE_HEIGHT_CAMPAIGN, LINE_HEIGHT_ARENA } from './constants';

const getCurrentWord = (textarea: HTMLTextAreaElement): string => {
    const pos = textarea.selectionStart;
    const text = textarea.value.slice(0, pos);
    const match = text.match(/[a-zA-Z_][a-zA-Z_0-9]*$/);
    return match ? match[0] : '';
};

const buildAcceptSuggestion = (
    setScriptInput: (val: string) => void,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
    setSuggestions: (s: Suggestion[]) => void,
) => (suggestion: Suggestion) => {
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

const buildHandleKeyDown = (
    suggestions: Suggestion[],
    activeIdx: number,
    setActiveIdx: (fn: (i: number) => number) => void,
    onAccept: (s: Suggestion) => void,
    setSuggestions: (s: Suggestion[]) => void,
) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            onAccept(suggestions[activeIdx]);
        }
    } else if (e.key === 'Escape') {
        setSuggestions([]);
    }
};

/**
 * Precise shadow-DOM caret positioning. Used by campaign editor.
 */
export const useAutocomplete = (
    setScriptInput: (val: string) => void,
    clearPrebuilt: () => void,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
    validateSyntax: (code: string) => void,
) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [caretXY, setCaretXY] = useState<CaretPosition>({ top: 0, left: 56 });

    const acceptSuggestion = buildAcceptSuggestion(setScriptInput, textareaRef, setSuggestions);

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

            const div = document.createElement('div');
            const style = window.getComputedStyle(ta);

            const propsToCopy = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'borderWidth', 'boxSizing', 'wordBreak', 'whiteSpace', 'letterSpacing', 'tabSize'];
            for (const prop of propsToCopy) {
                (div.style as any)[prop] = (style as any)[prop];
            }
            div.style.width = `${ta.offsetWidth}px`;
            div.style.position = 'absolute';
            div.style.visibility = 'hidden';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-all';

            const textBefore = ta.value.substring(0, pos);
            div.textContent = textBefore;

            const span = document.createElement('span');
            span.textContent = ta.value.substring(pos) || '.';
            div.appendChild(span);
            document.body.appendChild(div);

            const spanRect = span.getBoundingClientRect();
            const divRect = div.getBoundingClientRect();

            const caretTopInside = spanRect.top - divRect.top;
            const top = caretTopInside - ta.scrollTop + ta.offsetTop;
            let left = spanRect.left - divRect.left - ta.scrollLeft + ta.offsetLeft;

            const maxLeft = ta.offsetWidth - 385;
            if (left > maxLeft) {
                left = Math.max(0, maxLeft);
            }

            document.body.removeChild(div);

            const spaceBelow = ta.offsetHeight - top;
            const dropdownHeight = 250;

            if (spaceBelow < dropdownHeight && top > dropdownHeight) {
                const bottomDist = ta.offsetHeight - top + 4;
                setCaretXY({ bottom: bottomDist, top: 'auto', left });
            } else {
                setCaretXY({ top: top + LINE_HEIGHT_CAMPAIGN + 4, bottom: 'auto', left });
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleKeyDown = buildHandleKeyDown(suggestions, activeIdx, setActiveIdx, acceptSuggestion, setSuggestions);

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

/**
 * Fast line-count-based caret positioning. Used by arena HUD.
 */
export const useAutocompleteFast = (
    setScriptInput: (val: string) => void,
    clearPrebuilt: () => void,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
    validateSyntax: (code: string) => void,
) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [caretXY, setCaretXY] = useState<CaretPosition>({ bottom: 0, left: 56 });

    const acceptSuggestion = buildAcceptSuggestion(setScriptInput, textareaRef, setSuggestions);

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
            setCaretXY({ bottom: linesBelow * LINE_HEIGHT_ARENA + 28 + 4, left: 56 });
        } else {
            setSuggestions([]);
        }
    };

    const handleKeyDown = buildHandleKeyDown(suggestions, activeIdx, setActiveIdx, acceptSuggestion, setSuggestions);

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
