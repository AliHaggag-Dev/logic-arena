import React, { useEffect, useRef } from "react";

export const TerminalOutput: React.FC<{ output: string[] }> = ({ output }) => {
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    return (
        <div className="w-full h-full p-3 font-mono text-[11px] leading-relaxed flex flex-col" ref={outputRef}>
            {output.map((line, index) => {
                let colorClass = "text-cyan-600";
                if (line.includes("[SYS]") || line.includes("[SYSTEM]")) colorClass = "text-purple-400";
                if (line.includes("Logic Triggered")) colorClass = "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]";
                if (line.includes("[QUERY]")) colorClass = "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]";
                if (line.includes("[ERR]")) colorClass = "text-red-400";

                return <p key={index} className={`${colorClass} wrap-break-word font-medium py-0.5`}>{line}</p>;
            })}
            <div className="flex items-center gap-2 text-cyan-800/70 italic tracking-widest mt-2 shrink-0">
                <span className="w-1.5 h-3.5 bg-cyan-800/50 animate-pulse"></span>
                <p>Listening for activity logs...</p>
            </div>
        </div>
    );
};