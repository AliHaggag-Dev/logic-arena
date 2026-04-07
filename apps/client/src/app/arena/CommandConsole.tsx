import React, { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({ socket, robotId }) => {
    const [commandInput, setCommandInput] = useState<string>("");
    const [output, setOutput] = useState<string[]>([]);
    const outputRef = useRef<HTMLDivElement>(null);
    const [scriptInput, setScriptInput] = useState<string>("");

    const prebuiltScripts = {
        "Safe Mode": "IF health < 50 THEN MOVE",
        "Aggressive": "IF distance < 200 THEN FIRE",
        "Sniper": "IF distance < 1200 THEN FIRE",
    };

    const handleCommandSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const command = commandInput.trim().toUpperCase();
        if (command === "") return;

        setOutput((prev) => [...prev, `$ ${commandInput}`]);

        if (socket) {
            if (command === "FIRE") {
                socket.emit("manualCommand", { robotId, targetX: 600, targetY: 400 });
                setOutput((prev) => [...prev, `Command Sent: ${command}`]);
            } else {
                setOutput((prev) => [...prev, `Unknown command: ${command}`]);
            }
        } else {
            setOutput((prev) => [...prev, "Error: Socket not connected."]);
        }
        setCommandInput("");
    };

    const handleDeployBrain = (scriptToDeploy: string = scriptInput) => {
        if (socket) {
            socket.emit("updateLogic", { robotId, script: scriptToDeploy });
            setOutput((prev) => [...prev, `Script Deployed for ${robotId}: ${scriptToDeploy.substring(0, 30)}...`]);
        } else {
            setOutput((prev) => [...prev, "Error: Socket not connected."]);
        }
    };

    useEffect(() => {
        if (socket) {
            socket.on("logicExecuted", (data: { robotId: string; action: string }) => {
                if (data.robotId === robotId) {
                    setOutput((prev) => [...prev, `[${data.robotId}] Logic Triggered: ${data.action}`]);
                }
            });
        }
    }, [socket, robotId]);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    return (
        <div className="absolute bottom-4 left-4 w-96 bg-black/70 border border-green-500/30 p-4 font-mono text-sm text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)] z-20 backdrop-blur-sm">
            <div className="h-48 overflow-y-auto pr-2 mb-2" ref={outputRef}>
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
                    onChange={(e) => setScriptInput(e.target.value)}
                ></textarea>
                <button
                    type="button"
                    onClick={() => handleDeployBrain()}
                    className="mt-2 w-full px-4 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-400 font-mono text-sm hover:bg-purple-500/30 transition-all rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(192,34,197,0.2)]"
                >
                    Deploy Brain
                </button>
                <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(prebuiltScripts).map(([name, script]) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => handleDeployBrain(script)}
                            className="px-3 py-1 text-xs bg-gray-700/50 border border-gray-500/50 text-gray-300 rounded-md hover:bg-gray-600/50 transition-all"
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Ensure default export is still present if other modules import it as such
export default CommandConsole;
