/** Synchronous syntax highlighter for the overlay. */
export const highlightCode = (code: string): string => {
    const keywords = ["IF", "THEN", "ELSE", "END", "WHILE", "DO", "FUNCTION", "CALL", "FIRE", "BURST_FIRE", "MOVE", "MOVE_FAST", "STOP", "BACKUP", "PATHFIND", "SET", "NOT", "TRUE", "FALSE", "WAIT", "SCAN"];
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

    const lines = code.split('\n');
    return lines.map((line, i) => {
        const highlighted = line.replace(regex, (match) => `<span class="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">${match}</span>`);
        return `<div style="display: flex; min-height: 20px;"><span style="box-sizing: border-box; user-select: none; color: rgba(8, 145, 178, 0.5); text-align: right; width: 32px; border-right: 1px solid rgba(8, 145, 178, 0.4); padding-right: 8px; margin-right: 12px; flex-shrink: 0;">${i + 1}</span><span style="white-space: pre-wrap; word-break: break-all;">${highlighted || ' '}</span></div>`;
    }).join("");
};
