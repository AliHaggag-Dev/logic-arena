import React, { useState } from "react";

interface NeuralHandbookProps {
    isOpen: boolean;
    onSelect: (command: string) => void;
    fullWidth?: boolean;
}

export const NeuralHandbook: React.FC<NeuralHandbookProps> = ({ isOpen, onSelect, fullWidth = false }) => {
    const [activeTab, setActiveTab] = useState<"Control" | "Haptic" | "Math">("Control");

    const sections = {
        Control: [
            { label: "IF...THEN...ELSE...END", cmd: "IF health < 50 THEN\n  BACKUP\nELSE\n  FIRE\nEND" },
            { label: "WHILE...DO...END", cmd: "WHILE spotted DO\n  FIRE\n  WAIT 1\nEND" },
            { label: "FUNCTION / CALL", cmd: "FUNCTION retreat\n  BACKUP\n  MOVE_FAST\nEND\n\nCALL retreat" }
        ],
        Haptic: [
            { label: "SCAN Environment", cmd: "SCAN\nIF scanned_distance < 100 THEN FIRE" },
            { label: "WAIT execution", cmd: "WAIT 5" },
            { label: "Access Health/Distance", cmd: "IF distance > 300 THEN MOVE" }
        ],
        Math: [
            { label: "Variable Assignment (SET)", cmd: "SET attack_mode = TRUE" },
            { label: "Math Operators (+,-,*,/%)", cmd: "SET burst_timer = burst_timer + 1" },
            { label: "Logic Inversion (NOT)", cmd: "IF NOT spotted THEN PATHFIND" }
        ]
    };

    // Desktop: slide-in panel. Mobile (fullWidth): fills parent container.
    const outerClass = fullWidth
        ? "flex flex-col w-full h-full"
        : `transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isOpen ? "w-72 opacity-100 ml-4" : "w-0 opacity-0 ml-0"}`;

    const innerClass = fullWidth
        ? "flex flex-col gap-3 h-full"
        : "border border-cyan-800/60 bg-black/80 rounded-lg p-4 shadow-[0_0_20px_rgba(var(--arena-cyan-rgb),0.15)] flex flex-col gap-3 h-full min-w-[18rem]";

    return (
        <div className={outerClass}>
            <div className={innerClass}>
                <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest border-b border-cyan-900/50 pb-2 shrink-0">Script Guide</h3>

                <div className="flex gap-2 shrink-0">
                    {(["Control", "Haptic", "Math"] as const).map(tab => (
                        <button
                            type="button"
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded border ${activeTab === tab ? "bg-cyan-900/50 text-cyan-300 border-cyan-500/50" : "bg-transparent text-cyan-700 border-cyan-900/30 hover:bg-cyan-900/20"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className={`flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 ${fullWidth ? "flex-1 min-h-0" : "max-h-48"}`}>
                    {sections[activeTab].map((item, idx) => (
                        <div key={idx} className="bg-black/50 border border-cyan-900/30 p-3 rounded hover:border-cyan-500/50 transition-colors group">
                            <div className="text-cyan-600 text-[10px] mb-1.5 font-bold">{item.label}</div>
                            <div className="flex items-start gap-2">
                                <pre className="text-cyan-300 text-[10px] whitespace-pre-wrap font-mono flex-1">{item.cmd}</pre>
                                <button
                                    type="button"
                                    onClick={() => onSelect(item.cmd)}
                                    className={`text-[10px] bg-cyan-900/40 text-cyan-400 px-2.5 py-1.5 rounded font-bold tracking-wider transition-all shrink-0 ${
                                        fullWidth
                                            ? "opacity-100 active:bg-cyan-500/30"
                                            : "opacity-0 group-hover:opacity-100"
                                    }`}
                                >
                                    INSERT
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
