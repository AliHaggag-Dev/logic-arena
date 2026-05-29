import { useState, RefObject, useCallback } from 'react';
import type { Suggestion, CaretPosition } from './types';
import type { DiagnosticMarker } from '../../workers/parser.worker.types';
import { AUTOCOMPLETE_SUGGESTIONS, LINE_HEIGHT_CAMPAIGN, LINE_HEIGHT_ARENA } from './constants';

const getCurrentWord = (textarea: HTMLTextAreaElement): string => {
    const pos = textarea.selectionStart;
    const text = textarea.value.slice(0, pos);
    const match = text.match(/[a-zA-Z_][a-zA-Z_0-9]*$/);
    return match ? match[0] : '';
};

/**
 * Find a diagnostic marker at the cursor position.
 */
function findDiagnosticAtCursor(
    textarea: HTMLTextAreaElement,
    diagnostics: DiagnosticMarker[],
): DiagnosticMarker | null {
    if (diagnostics.length === 0) return null;

    const value = textarea.value;
    const pos = textarea.selectionStart;

    // Determine current line and column
    const textBefore = value.slice(0, pos);
    const lineIdx = textBefore.split('\n').length - 1;
    const lastNewline = textBefore.lastIndexOf('\n');
    const col = pos - lastNewline - 1;

    // Find a diagnostic that spans this position
    for (const diag of diagnostics) {
        if (diag.line === lineIdx && col >= diag.startCol && col <= diag.endCol) {
            return diag;
        }
    }
    return null;
}

/**
 * Apply a diagnostic fix (replace word or delete line).
 */
export function applyDiagnosticFix(
    textarea: HTMLTextAreaElement,
    diag: DiagnosticMarker,
    setScriptInput: (val: string) => void,
    validateSyntax: (code: string) => void,
): void {
    const value = textarea.value;
    const lines = value.split('\n');

    if (diag.action === 'replace' && diag.suggestion) {
        // Replace the word at the diagnostic position
        const line = lines[diag.line] ?? '';
        const newLine = line.slice(0, diag.startCol) + diag.suggestion + line.slice(diag.endCol);
        lines[diag.line] = newLine;
        const newVal = lines.join('\n');
        setScriptInput(newVal);
        validateSyntax(newVal);

        // Position cursor after the replaced word
        const lineStart = lines.slice(0, diag.line).join('\n').length + (diag.line > 0 ? 1 : 0);
        const newPos = lineStart + diag.startCol + diag.suggestion.length;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    } else if (diag.action === 'delete') {
        // Delete the entire line containing the diagnostic
        lines.splice(diag.line, 1);
        const newVal = lines.join('\n');
        setScriptInput(newVal);
        validateSyntax(newVal);

        // Position cursor at the start of the next line (or end of previous)
        const targetLine = Math.min(diag.line, lines.length - 1);
        const lineStart = lines.slice(0, Math.max(0, targetLine)).join('\n').length + (targetLine > 0 ? 1 : 0);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
        }, 0);
    }
}

/**
 * Precise shadow-DOM caret positioning. Used by campaign editor.
 */
export const useAutocomplete = (
    setScriptInput: (val: string) => void,
    clearPrebuilt: () => void,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
    validateSyntax: (code: string) => void,
    diagnostics: DiagnosticMarker[] = [],
) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [caretXY, setCaretXY] = useState<CaretPosition>({ top: 0, left: 56 });

    const acceptSuggestion = useCallback((suggestion: Suggestion) => {
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
    }, [setScriptInput, textareaRef]);

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
                (div.style as unknown as Record<string, string>)[prop] = (style as unknown as Record<string, string>)[prop] ?? '';
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

            const taRect = ta.getBoundingClientRect();
            const caretScreenY = taRect.top + top;
            const cursorYInTextarea = caretTopInside - ta.scrollTop;
            const spaceBelowWindow = window.innerHeight - caretScreenY;

            let showAbove = false;
            if (cursorYInTextarea < 100) {
                // Near the top of the textarea viewport: always show below
                showAbove = false;
            } else if (ta.clientHeight - cursorYInTextarea < 100) {
                // Near the bottom of the textarea viewport: show above
                showAbove = true;
            } else if (spaceBelowWindow < 250) {
                // Not enough screen space below: show above
                showAbove = true;
            }

            if (showAbove) {
                const container = ta.closest('.group') || ta;
                const containerRect = container.getBoundingClientRect();
                const bottomDist = containerRect.bottom - caretScreenY + 4;
                setCaretXY({ bottom: bottomDist, top: 'auto', left, useTop: false });
            } else {
                setCaretXY({ top: top + LINE_HEIGHT_CAMPAIGN + 4, bottom: 'auto', left, useTop: true });
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // If autocomplete suggestions are visible, they take priority
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx(i => Math.max(i - 1, 0));
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                if (suggestions[activeIdx]) {
                    e.preventDefault();
                    acceptSuggestion(suggestions[activeIdx]!);
                }
            } else if (e.key === 'Escape') {
                setSuggestions([]);
            }
            return;
        }

        // No autocomplete — check for Tab-to-fix diagnostics
        if (e.key === 'Tab') {
            const ta = textareaRef.current;
            if (!ta) return;

            if (diagnostics.length > 0) {
                const diag = findDiagnosticAtCursor(ta, diagnostics);
                if (diag && (diag.suggestion || diag.action === 'delete')) {
                    e.preventDefault();
                    applyDiagnosticFix(ta, diag, setScriptInput, validateSyntax);
                    return;
                }
            }

            // Fallback to inserting a standard 2-space tab indent
            e.preventDefault();
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const next = val.substring(0, start) + "  " + val.substring(end);
            setScriptInput(next);
            validateSyntax(next);

            // Position cursor after the tab
            setTimeout(() => {
                ta.focus();
                ta.setSelectionRange(start + 2, start + 2);
            }, 0);
        }
    }, [suggestions, activeIdx, acceptSuggestion, diagnostics, textareaRef, setScriptInput, validateSyntax]);

    const handleApplyDiagnosticFix = useCallback((diag: DiagnosticMarker) => {
        const ta = textareaRef.current;
        if (!ta) return;
        applyDiagnosticFix(ta, diag, setScriptInput, validateSyntax);
    }, [textareaRef, setScriptInput, validateSyntax]);

    const clearSuggestions = () => setSuggestions([]);

    return {
        suggestions,
        activeIdx,
        caretXY,
        handleChange,
        handleKeyDown,
        acceptSuggestion,
        clearSuggestions,
        handleApplyDiagnosticFix
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
    diagnostics: DiagnosticMarker[] = [],
) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [caretXY, setCaretXY] = useState<CaretPosition>({ top: 36, left: 56 });

    const acceptSuggestion = useCallback((suggestion: Suggestion) => {
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
    }, [setScriptInput, textareaRef]);

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
            const lineIdx = linesBefore.length - 1;

            const container = ta.closest('.group') || ta;
            const containerRect = container.getBoundingClientRect();
            const taRect = ta.getBoundingClientRect();

            // Calculate exact screen Y of top and bottom of the current line
            const caretScreenY = taRect.top + (lineIdx * LINE_HEIGHT_ARENA) + 16 - ta.scrollTop;
            const caretScreenBottomY = caretScreenY + LINE_HEIGHT_ARENA;

            // Space below the line to the bottom of the window and the parent container
            const spaceBelowWindow = window.innerHeight - caretScreenBottomY;

            // Relative Y position of the current line inside the textarea viewport
            const cursorYInTextarea = (lineIdx * LINE_HEIGHT_ARENA) + 16 - ta.scrollTop;

            let showAbove = false;
            if (cursorYInTextarea < 100) {
                // Near the top of the textarea viewport: always show below
                showAbove = false;
            } else if (ta.clientHeight - cursorYInTextarea < 100) {
                // Near the bottom of the textarea viewport: show above
                showAbove = true;
            } else if (spaceBelowWindow < 250) {
                // Not enough screen space below: show above
                showAbove = true;
            }

            if (showAbove) {
                const bottomVal = containerRect.bottom - caretScreenY;
                setCaretXY({ top: 'auto', bottom: bottomVal, left: 56, useTop: false });
            } else {
                const topVal = (lineIdx + 1) * LINE_HEIGHT_ARENA + 16 - ta.scrollTop + (ta.offsetTop || 0);
                setCaretXY({ top: topVal, bottom: 'auto', left: 56, useTop: true });
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // If autocomplete suggestions are visible, they take priority
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx(i => Math.max(i - 1, 0));
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                if (suggestions[activeIdx]) {
                    e.preventDefault();
                    acceptSuggestion(suggestions[activeIdx]!);
                }
            } else if (e.key === 'Escape') {
                setSuggestions([]);
            }
            return;
        }

        // No autocomplete — check for Tab-to-fix diagnostics
        if (e.key === 'Tab') {
            const ta = textareaRef.current;
            if (!ta) return;

            if (diagnostics.length > 0) {
                const diag = findDiagnosticAtCursor(ta, diagnostics);
                if (diag && (diag.suggestion || diag.action === 'delete')) {
                    e.preventDefault();
                    applyDiagnosticFix(ta, diag, setScriptInput, validateSyntax);
                    return;
                }
            }

            // Fallback to inserting a standard 2-space tab indent
            e.preventDefault();
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const next = val.substring(0, start) + "  " + val.substring(end);
            setScriptInput(next);
            validateSyntax(next);

            // Position cursor after the tab
            setTimeout(() => {
                ta.focus();
                ta.setSelectionRange(start + 2, start + 2);
            }, 0);
        }
    }, [suggestions, activeIdx, acceptSuggestion, diagnostics, textareaRef, setScriptInput, validateSyntax]);

    const handleApplyDiagnosticFix = useCallback((diag: DiagnosticMarker) => {
        const ta = textareaRef.current;
        if (!ta) return;
        applyDiagnosticFix(ta, diag, setScriptInput, validateSyntax);
    }, [textareaRef, setScriptInput, validateSyntax]);

    const clearSuggestions = () => setSuggestions([]);

    return {
        suggestions,
        activeIdx,
        caretXY,
        handleChange,
        handleKeyDown,
        acceptSuggestion,
        clearSuggestions,
        handleApplyDiagnosticFix
    };
};
