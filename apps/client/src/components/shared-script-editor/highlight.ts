import type { DiagnosticMarker } from '../../workers/parser.worker.types';

export interface HighlightOptions {
    keywordClass?: string;
    commandClass?: string;
    controlClass?: string;
    identifierClass?: string;
    functionClass?: string;
    lineNumberColor?: string;
    lineNumberWidth?: string;
    lineHeight?: number;
    lineNumberPaddingRight?: string;
    lineNumberMarginRight?: string;
    borderColor?: string;
    fontSize?: string;
    wordBreak?: string;
    diagnostics?: DiagnosticMarker[];
}

const CONTROL_KEYWORDS = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FOR", "SET"];
const COMMAND_KEYWORDS = ["MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "FIRE", "BURST_FIRE", "WAIT", "SCAN"];
const FUNCTION_KEYWORDS = ["FUNCTION", "CALL"];
const IDENTIFIER_KEYWORDS = ["TRUE", "FALSE", "NOT"];

/**
 * Escape HTML special characters to prevent XSS in innerHTML.
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Apply diagnostic markers (wavy underlines) to an already-highlighted HTML line.
 *
 * We work on the raw text offsets (before HTML escaping changes lengths),
 * so we inject markers at the raw-text level, then escape the rest.
 */
function applyDiagnosticsToLine(
    rawLine: string,
    lineIdx: number,
    diagnostics: DiagnosticMarker[],
    globalDiagStartIdx: number,
): { html: string; nextIdx: number } {
    // Find diagnostics for this line
    const lineDiags: DiagnosticMarker[] = [];
    let nextIdx = globalDiagStartIdx;

    while (nextIdx < diagnostics.length && diagnostics[nextIdx]!.line === lineIdx) {
        lineDiags.push(diagnostics[nextIdx]!);
        nextIdx++;
    }

    if (lineDiags.length === 0) {
        return { html: rawLine, nextIdx };
    }

    // Build the line by splicing in diagnostic spans at the right offsets
    let result = '';
    let cursor = 0;

    for (const diag of lineDiags) {
        const start = Math.max(diag.startCol, cursor);
        const end = Math.min(diag.endCol, rawLine.length);
        if (start >= end) continue;

        // Text before this diagnostic
        result += rawLine.slice(cursor, start);

        // The diagnostic word
        const word = rawLine.slice(start, end);
        const color = diag.severity === 'error'
            ? 'var(--sem-danger)'
            : 'var(--sem-warning)';
        const bgColor = diag.severity === 'error'
            ? 'rgba(var(--sem-danger-rgb), 0.08)'
            : 'rgba(var(--sem-warning-rgb), 0.08)';

        // data-diag-idx stores the global index for hover hit-testing
        const diagGlobalIdx = globalDiagStartIdx + lineDiags.indexOf(diag);

        result += `<span data-diag-idx="${diagGlobalIdx}" style="text-decoration: wavy underline ${color}; text-decoration-thickness: 1.5px; text-underline-offset: 3px; background: ${bgColor}; border-radius: 2px; cursor: help; position: relative; pointer-events: auto;" title="${escapeHtml(diag.message)}">${word}</span>`;

        cursor = end;
    }

    // Remaining text
    result += rawLine.slice(cursor);

    return { html: result, nextIdx };
}

export const highlightCode = (code: string, options?: HighlightOptions): string => {
    const {
        keywordClass = 'text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.65)]',
        commandClass = keywordClass,
        controlClass = keywordClass,
        identifierClass = keywordClass,
        functionClass = keywordClass,
        lineNumberColor = 'rgba(var(--accent-rgb), 0.45)',
        lineNumberWidth = '40px',
        lineHeight = 24,
        lineNumberPaddingRight = '12px',
        lineNumberMarginRight = '16px',
        borderColor = 'rgba(var(--accent-rgb), 0.2)',
        fontSize = '11px',
        wordBreak = 'break-all',
        diagnostics = [],
    } = options ?? {};

    const lines = code.split('\n');
    let diagIdx = 0;

    return lines.map((line, i) => {
        const COMMENT_COLOR = '#4ade80';

        // Detect comment position in the raw line (before any HTML escaping)
        const slashIdx = line.indexOf('//');
        const dashIdx = line.indexOf('--');
        const commentStart = slashIdx >= 0 && dashIdx >= 0
            ? Math.min(slashIdx, dashIdx)
            : slashIdx >= 0 ? slashIdx : dashIdx;

        // Full-line comment: entire line is a comment
        if (commentStart >= 0 && line.slice(0, commentStart).trim() === '') {
            const escaped = escapeHtml(line);
            return `<div style="display: flex; min-height: ${lineHeight}px; align-items: center;"><span style="box-sizing: border-box; user-select: none; color: ${lineNumberColor}; text-align: right; min-width: ${lineNumberWidth}; border-right: 1px solid ${borderColor}; padding-right: ${lineNumberPaddingRight}; margin-right: ${lineNumberMarginRight}; flex-shrink: 0; font-size: ${fontSize}; letter-spacing: 0.05em;">${i + 1}</span><span style="white-space: pre-wrap; word-break: ${wordBreak}; tab-size: 2; color: ${COMMENT_COLOR}; font-style: italic; opacity: 0.7;">${escaped || ' '}</span></div>`;
        }

        // Inline comment: split into code part + comment part
        const codePart = commentStart >= 0 ? line.slice(0, commentStart) : line;
        const commentPart = commentStart >= 0 ? line.slice(commentStart) : '';

        // Apply diagnostics only on the code part
        let processed = codePart;
        if (diagnostics.length > 0) {
            const result = applyDiagnosticsToLine(codePart, i, diagnostics, diagIdx);
            processed = result.html;
            diagIdx = result.nextIdx;
        }

        // Apply keyword highlighting on the code part
        let highlighted = processed;
        highlighted = highlighted.replace(new RegExp(`(?<!<\/span>)\\b(${CONTROL_KEYWORDS.join("|")})\\b(?![^<]*<\\/span>)`, "gi"), (match) => `<span class="${controlClass}">${match}</span>`);
        highlighted = highlighted.replace(new RegExp(`(?<!<\/span>)\\b(${COMMAND_KEYWORDS.join("|")})\\b(?![^<]*<\\/span>)`, "gi"), (match) => `<span class="${commandClass}">${match}</span>`);
        highlighted = highlighted.replace(new RegExp(`(?<!<\/span>)\\b(${FUNCTION_KEYWORDS.join("|")})\\b(?![^<]*<\\/span>)`, "gi"), (match) => `<span class="${functionClass}">${match}</span>`);
        highlighted = highlighted.replace(new RegExp(`(?<!<\/span>)\\b(${IDENTIFIER_KEYWORDS.join("|")})\\b(?![^<]*<\\/span>)`, "gi"), (match) => `<span class="${identifierClass}">${match}</span>`);

        // Append the comment part in green (if any)
        if (commentPart) {
            highlighted += `<span style="color: ${COMMENT_COLOR}; font-style: italic; opacity: 0.7;">${escapeHtml(commentPart)}</span>`;
        }

        return `<div style="display: flex; min-height: ${lineHeight}px; align-items: center;"><span style="box-sizing: border-box; user-select: none; color: ${lineNumberColor}; text-align: right; min-width: ${lineNumberWidth}; border-right: 1px solid ${borderColor}; padding-right: ${lineNumberPaddingRight}; margin-right: ${lineNumberMarginRight}; flex-shrink: 0; font-size: ${fontSize}; letter-spacing: 0.05em;">${i + 1}</span><span style="white-space: pre-wrap; word-break: ${wordBreak}; tab-size: 2;">${highlighted || ' '}</span></div>`;
    }).join("");
};
