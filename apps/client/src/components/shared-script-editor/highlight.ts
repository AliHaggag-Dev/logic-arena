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
}

const CONTROL_KEYWORDS = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FOR", "SET"];
const COMMAND_KEYWORDS = ["MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "FIRE", "BURST_FIRE", "WAIT", "SCAN"];
const FUNCTION_KEYWORDS = ["FUNCTION", "CALL"];
const IDENTIFIER_KEYWORDS = ["TRUE", "FALSE", "NOT"];

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
    } = options ?? {};

    const lines = code.split('\n');
    return lines.map((line, i) => {
        let highlighted = line;
        highlighted = highlighted.replace(new RegExp(`\\b(${CONTROL_KEYWORDS.join("|")})\\b`, "gi"), (match) => `<span class="${controlClass}">${match}</span>`);
        highlighted = highlighted.replace(new RegExp(`\\b(${COMMAND_KEYWORDS.join("|")})\\b`, "gi"), (match) => `<span class="${commandClass}">${match}</span>`);
        highlighted = highlighted.replace(new RegExp(`\\b(${FUNCTION_KEYWORDS.join("|")})\\b`, "gi"), (match) => `<span class="${functionClass}">${match}</span>`);
        highlighted = highlighted.replace(new RegExp(`\\b(${IDENTIFIER_KEYWORDS.join("|")})\\b`, "gi"), (match) => `<span class="${identifierClass}">${match}</span>`);
        return `<div style="display: flex; min-height: ${lineHeight}px; align-items: center;"><span style="box-sizing: border-box; user-select: none; color: ${lineNumberColor}; text-align: right; min-width: ${lineNumberWidth}; border-right: 1px solid ${borderColor}; padding-right: ${lineNumberPaddingRight}; margin-right: ${lineNumberMarginRight}; flex-shrink: 0; font-size: ${fontSize}; letter-spacing: 0.05em;">${i + 1}</span><span style="white-space: pre-wrap; word-break: ${wordBreak}; tab-size: 2;">${highlighted || ' '}</span></div>`;
    }).join("");
};
