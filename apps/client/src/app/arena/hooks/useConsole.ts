import { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import { apiClient } from "../../../lib/api-client";

export const useConsole = (socket: Socket | null, robotId: string, scriptId?: string | null) => {
    const [output, setOutput] = useState<string[]>([]);
    const [commandInput, setCommandInput] = useState<string>("");
    const [scriptInput, setScriptInput] = useState<string>("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [activePrebuilt, setActivePrebuilt] = useState<string | null>(null);

    const appendOutputLine = useCallback((line: string) => {
        setOutput((prev) => {
            const next = [...prev, line];
            return next.slice(-60); // Keeps memory lean
        });
    }, []);

    const appendScriptLine = useCallback((line: string) => {
        setScriptInput((prev) => {
            const sanitized = prev.trim();
            return sanitized ? `${sanitized}\n${line}` : `${line}\n`;
        });
        setActivePrebuilt(null);
    }, []);

    const handleCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const command = commandInput.trim().toUpperCase();
        if (!command) return;

        appendOutputLine(`> ${commandInput}`);

        if (socket) {
            if (command === "FIRE") {
                socket.emit("manualCommand", { robotId, targetX: 600, targetY: 400 });
                appendOutputLine(`[SYS] Command Broadcast: ${command}`);
            } else {
                appendOutputLine(`[ERR] Unknown sequence: ${command}`);
            }
        } else {
            appendOutputLine("[ERR] Uplink severed. Socket offline.");
        }
        setCommandInput("");
    };

    const handleDeployBrain = async (scriptToDeploy: string = scriptInput) => {
        if (socket) {
            socket.emit("updateLogic", { robotId, scriptContent: scriptToDeploy });
            appendOutputLine(`[UPLINK] Neural payload injected into ${robotId}...`);

            try {
                if (scriptId) {
                    await apiClient.put(`/scripts/${scriptId}`, { content: scriptToDeploy });
                } else {
                    await apiClient.post("/scripts", { title: "Arena Script", content: scriptToDeploy });
                }
                appendOutputLine("[SYS] Script auto-saved to cloud repository.");
            } catch (error: any) {
                appendOutputLine(`[ERR] Cloud sync failed: ${error.message}`);
            }
        } else {
            appendOutputLine("[ERR] Uplink severed. Socket offline.");
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
        return () => { socket.off("logicExecuted", handleLogicExecuted); };
    }, [socket, robotId, appendOutputLine]);

    return {
        output,
        commandInput,
        setCommandInput,
        scriptInput,
        setScriptInput,
        isLibraryOpen,
        setIsLibraryOpen,
        activePrebuilt,
        setActivePrebuilt,
        appendScriptLine,
        handleCommandSubmit,
        handleDeployBrain
    };
};