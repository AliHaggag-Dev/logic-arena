import React, { useState } from "react";

interface NeuralHandbookProps {
    isOpen: boolean;
    onSelect: (command: string) => void;
}

export const NeuralHandbook: React.FC<NeuralHandbookProps> = ({ isOpen, onSelect }) => {
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
            { label: "Math Operators (+,-,*,/,%)", cmd: "SET burst_timer = burst_timer + 1" },
            { label: "Logic Inversion (NOT)", cmd: "IF NOT spotted THEN PATHFIND" }
        ]
    };

    return (
        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isOpen ? "w-72 opacity-100 ml-4" : "w-0 opacity-0 ml-0"}`}>
            <div className="border border-cyan-800/60 bg-black/80 rounded-lg p-4 shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col gap-3 h-full min-w-[18rem]">
                <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest border-b border-cyan-900/50 pb-2">Neural Handbook</h3>

                <div className="flex gap-2">
                    {(["Control", "Haptic", "Math"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded border ${activeTab === tab ? "bg-cyan-900/50 text-cyan-300 border-cyan-500/50" : "bg-transparent text-cyan-700 border-cyan-900/30 hover:bg-cyan-900/20"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {sections[activeTab].map((item, idx) => (
                        <div key={idx} className="bg-black/50 border border-cyan-900/30 p-2 rounded hover:border-cyan-500/50 transition-colors group">
                            <div className="text-cyan-600 text-[10px] mb-1 font-bold">{item.label}</div>
                            <div className="flex items-center gap-2">
                                <pre className="text-cyan-300 text-[10px] whitespace-pre-wrap font-mono flex-1">{item.cmd}</pre>
                                <button
                                    onClick={() => onSelect(item.cmd)}
                                    className="text-[10px] bg-cyan-900/40 text-cyan-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
