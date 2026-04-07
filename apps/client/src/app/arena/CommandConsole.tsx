import React, { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
}

const CommandConsole: React.FC<CommandConsoleProps> = ({ socket, robotId }) => {
    const [commandInput, setCommandInput] = useState<string>("");
    const [output, setOutput] = useState<string[]>([]);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleCommandSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const command = commandInput.trim().toUpperCase();
        if (command === "") return;

        setOutput((prev) => [...prev, `$ ${commandInput}`]);

        if (socket) {
            if (command === "FIRE") {
                socket.emit("manualCommand", { command: "FIRE", robotId });
                setOutput((prev) => [...prev, `Command Sent: ${command}`]);
            } else {
                setOutput((prev) => [...prev, `Unknown command: ${command}`]);
            }
        } else {
            setOutput((prev) => [...prev, "Error: Socket not connected."]);
        }
        setCommandInput("");
    };

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    return (
        <div className="absolute bottom-4 left-4 w-96 h-64 bg-black/70 border border-green-500/30 p-4 font-mono text-sm text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)] z-20 backdrop-blur-sm">
            <div className="h-48 overflow-y-auto pr-2 mb-2" ref={outputRef}>
                {output.map((line, index) => (
                    <p key={index} className={line.startsWith("Command Sent:") ? "text-blue-400" : ""}>
                        {line}
                    </p>
                ))}
            </div>
            <form onSubmit={handleCommandSubmit} className="flex">
                <span className="mr-2">$</span>
                <input
                    placeholder="Enter a command"
                    type="text"
                    className="flex-grow bg-transparent outline-none text-green-400"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    autoFocus
                />
            </form>
        </div>
    );
};

export default CommandConsole;
