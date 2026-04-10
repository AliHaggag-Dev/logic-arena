import React, { memo, useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
    availableRobots: string[];
    onRobotChange: (id: string) => void;
}

const COMMAND_DOCS: Record<string, string[]> = {
    Movement: [
        "MOVE",
        "STOP",
        "MOVE_FAST",
        "BACKUP",
        "PATHFIND"
    ],
    Attack: [
        "FIRE",
        "BURST_FIRE",
        "IF spotted THEN FIRE",
        "IF distance < 500 THEN FIRE"
    ],
    "Advanced Combat": [
        "IF health < 20 THEN STOP"
    ],
    Tactics: [
        "IF spotted THEN MOVE"
    ],
    "Evasion (الهروب)": [
        "IF health < 30 THEN MOVE",
        "IF distance < 200 THEN MOVE"
    ],
    Intelligence: [
        "SET rotation = rotation + 0.1",
        "IF NOT spotted THEN SET rotation = rotation + 0.1"
    ]
};

const REFERENCE_ITEMS = [
    "health",
    "distance",
    "spotted",
    "rotation",
    "target_vx",
    "target_vy",
    "bullet_speed"
];

const CommandConsoleComponent: React.FC<CommandConsoleProps> = ({ socket, robotId, availableRobots, onRobotChange }) => {
    const [commandInput, setCommandInput] = useState<string>("");
    const [output, setOutput] = useState<string[]>([]);
    const outputRef = useRef<HTMLDivElement>(null);
    const [scriptInput, setScriptInput] = useState<string>("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isReferenceOpen, setIsReferenceOpen] = useState(false);
    const [activePrebuilt, setActivePrebuilt] = useState<string | null>(null);

    const appendOutputLine = (line: string) => {
        setOutput((prev) => {
            const next = [...prev, line];
            return next.slice(-50);
        });
    };

    const appendScriptLine = (line: string) => {
        setScriptInput((prev) => {
            const sanitizedPrev = prev.trim();
            return sanitizedPrev ? `${sanitizedPrev}\n${line}` : `${line}\n`;
        });
        setActivePrebuilt(null);
    };

    const prebuiltScripts = {
        "Safe Mode": "IF health < 50 THEN MOVE",
        "Aggressive": "IF distance < 200 THEN FIRE",
        "Sniper": "IF distance < 1200 THEN FIRE",
    };

    const handleCommandSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const command = commandInput.trim().toUpperCase();
        if (command === "") return;

        appendOutputLine(`$ ${commandInput}`);

        if (socket) {
            if (command === "FIRE") {
                socket.emit("manualCommand", { robotId, targetX: 600, targetY: 400 });
                appendOutputLine(`Command Sent: ${command}`);
            } else {
                appendOutputLine(`Unknown command: ${command}`);
            }
        } else {
            appendOutputLine("Error: Socket not connected.");
        }
        setCommandInput("");
    };

    const handleDeployBrain = (scriptToDeploy: string = scriptInput) => {
        if (socket) {
            socket.emit("updateLogic", { robotId, script: scriptToDeploy });
            appendOutputLine(`Script Deployed for ${robotId}: ${scriptToDeploy.substring(0, 30)}...`);
        } else {
            appendOutputLine("Error: Socket not connected.");
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleLogicExecuted = (data: { robotId: string; action: string }) => {
            if (data.robotId === robotId) {
                appendOutputLine(`[${data.robotId}] Logic Triggered: ${data.action}`);
            }
        };

        socket.on("logicExecuted", handleLogicExecuted);

        return () => {
            socket.off("logicExecuted", handleLogicExecuted);
        };
    }, [socket, robotId]);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    return (
        <div className="absolute bottom-6 left-6 w-96 max-h-[70vh] bg-black/70 border border-green-500/30 p-4 font-mono text-sm text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)] z-20 backdrop-blur-sm">
            <div className="flex gap-2 mb-4 border-b border-green-500/20 pb-2">
                {availableRobots.map(id => (
                    <button
                        type="button"
                        key={id}
                        onClick={() => onRobotChange(id)}
                        className={`px-3 py-1 text-xs font-bold transition-all ${robotId === id
                            ? "bg-green-500 text-black shadow-[0_0_10px_#22c55e]"
                            : "bg-gray-800 text-gray-400 hover:text-green-400"
                            } rounded`}
                    >
                        {id.toUpperCase()}
                    </button>
                ))}
            </div>
            <div className="h-40 overflow-y-auto pr-2 mb-2 no-scrollbar" ref={outputRef}>
                {output.map((line, index) => (
                    <p key={index} className={line.startsWith("Command Sent:") || line.startsWith("Script Deployed:") || line.includes("Logic Triggered:") ? "text-blue-400" : ""}>
                        {line}
                    </p>
                ))}
            </div>
            <form onSubmit={handleCommandSubmit} className="flex mb-2">
                <span className="mr-2">$</span>
                <input
                    placeholder="Enter a command (e.g., FIRE)"
                    type="text"
                    className="flex-grow bg-transparent outline-none text-green-400"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    autoFocus
                />
            </form>
            <div className="mt-4">
                <textarea
                    className="w-full h-24 bg-black/50 border border-green-500/30 p-2 text-green-400 font-mono text-xs outline-none focus:border-green-400"
                    placeholder="Enter robot logic (e.g., IF distance < 100 THEN FIRE)"
                    value={scriptInput}
                    onChange={(e) => {
                        setScriptInput(e.target.value);
                        setActivePrebuilt(null);
                    }}
                ></textarea>
                <div className="mt-2 flex gap-2 relative">
                    <button
                        type="button"
                        onClick={() => handleDeployBrain()}
                        className="flex-1 px-4 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-400 font-mono text-sm hover:bg-purple-500/30 transition-all rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(192,34,197,0.2)]"
                    >
                        Deploy Brain
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLibraryOpen((prev) => !prev)}
                        className="flex-1 px-4 py-2 bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 font-mono text-sm hover:bg-cyan-500/30 transition-all rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    >
                        📚 Commands
                    </button>
                </div>

                {isLibraryOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-full max-h-[300px] overflow-y-auto border border-cyan-500/20 bg-black/80 p-2 text-xs text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)] no-scrollbar z-40">
                        {Object.entries(COMMAND_DOCS).map(([category, commands]) => (
                            <div key={category} className="mb-3 last:mb-0">
                                <p className="text-cyan-300 uppercase tracking-widest text-[10px]">{category}</p>
                                <div className="mt-1 flex flex-col gap-1">
                                    {commands.map((command) => (
                                        <button
                                            key={command}
                                            type="button"
                                            title="Click to load into editor"
                                            onClick={() => appendScriptLine(command)}
                                            className="text-left rounded border border-cyan-500/20 bg-black/40 px-2 py-1 hover:bg-cyan-500/10 hover:text-cyan-100 transition-all"
                                        >
                                            {command}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-3 border border-green-500/20 bg-black/40 text-[10px] text-green-300">
                    <button
                        type="button"
                        onClick={() => setIsReferenceOpen((prev) => !prev)}
                        className="w-full px-2 py-2 flex items-center justify-between uppercase tracking-widest text-green-400 text-[10px] border-b border-green-500/20 hover:bg-green-500/10 transition-all"
                    >
                        <span>Reference</span>
                        <span>{isReferenceOpen ? "−" : "+"}</span>
                    </button>
                    {isReferenceOpen && (
                        <div className="p-2">
                            <div className="flex flex-wrap gap-2 text-green-200">
                                {REFERENCE_ITEMS.map((item) => (
                                    <span key={item} className="px-2 py-0.5 border border-green-500/30 rounded">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(prebuiltScripts).map(([name, script]) => {
                        const isActive = activePrebuilt === name;
                        return (
                            <button
                                key={name}
                                type="button"
                                onClick={() => {
                                    setScriptInput(script);
                                    setActivePrebuilt(name);
                                    handleDeployBrain(script);
                                }}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${isActive
                                    ? "bg-green-500/20 border border-green-400 text-green-200 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                    : "bg-gray-700/50 border border-gray-500/50 text-gray-300 hover:bg-gray-600/50"
                                    }`}
                            >
                                {name}
                                {isActive && <span className="ml-2 text-[10px] font-bold">ACTIVE</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
            <style jsx global>{`
                .no-scrollbar {
                    scrollbar-width: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export const CommandConsole = memo(CommandConsoleComponent);

export default CommandConsole;