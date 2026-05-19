export interface HighlightOptions {
    keywordClass?: string;
    lineNumberColor?: string;
    lineNumberWidth?: string;
    lineHeight?: number;
    lineNumberPaddingRight?: string;
    lineNumberMarginRight?: string;
    borderColor?: string;
    fontSize?: string;
    wordBreak?: string;
}

export const highlightCode = (code: string, options?: HighlightOptions): string => {
    const {
        keywordClass = 'text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.65)]',
        lineNumberColor = 'rgba(var(--accent-rgb), 0.45)',
        lineNumberWidth = '40px',
        lineHeight = 24,
        lineNumberPaddingRight = '12px',
        lineNumberMarginRight = '16px',
        borderColor = 'rgba(var(--accent-rgb), 0.2)',
        fontSize = '11px',
        wordBreak = 'break-all',
    } = options ?? {};

    const keywords = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FUNCTION", "CALL", "FIRE", "BURST_FIRE", "MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "SET", "NOT", "TRUE", "FALSE", "WAIT", "SCAN"];
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

    const lines = code.split('\n');
    return lines.map((line, i) => {
        const highlighted = line.replace(regex, (match) => `<span class="${keywordClass}">${match}</span>`);
        return `<div style="display: flex; min-height: ${lineHeight}px; align-items: center;"><span style="box-sizing: border-box; user-select: none; color: ${lineNumberColor}; text-align: right; min-width: ${lineNumberWidth}; border-right: 1px solid ${borderColor}; padding-right: ${lineNumberPaddingRight}; margin-right: ${lineNumberMarginRight}; flex-shrink: 0; font-size: ${fontSize}; letter-spacing: 0.05em;">${i + 1}</span><span style="white-space: pre-wrap; word-break: ${wordBreak}; tab-size: 2;">${highlighted || ' '}</span></div>`;
    }).join("");
};
