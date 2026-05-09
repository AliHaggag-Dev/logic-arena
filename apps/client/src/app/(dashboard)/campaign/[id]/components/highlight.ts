/** Synchronous syntax highlighter for the overlay. */
export const highlightCode = (code: string): string => {
    const keywords = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FUNCTION", "CALL", "FIRE", "BURST_FIRE", "MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "SET", "NOT", "TRUE", "FALSE", "WAIT", "SCAN"];
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

    const lines = code.split('\n');
    return lines.map((line, i) => {
    const highlighted = line.replace(regex, (match) => `<span class="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.65)]">${match}</span>`);
    return `<div style="display: flex; min-height: 24px; align-items: center;"><span style="box-sizing: border-box; user-select: none; color: rgba(var(--accent-rgb), 0.45); text-align: right; min-width: 40px; border-right: 1px solid rgba(var(--accent-rgb), 0.2); padding-right: 12px; margin-right: 16px; flex-shrink: 0; font-size: 11px; letter-spacing: 0.05em;">${i + 1}</span><span style="white-space: pre-wrap; word-break: break-all; tab-size: 2;">${highlighted || ' '}</span></div>`;
    }).join("");
};
