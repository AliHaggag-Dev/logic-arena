import React, { memo, useState } from "react";
import { Socket } from "socket.io-client";
import { useConsole } from "../../hooks/useConsole";
import { BotSelector } from "./BotSelector";
import { TerminalOutput } from "./TerminalOutput";
import { ScriptEditor } from "./ScriptEditor";
import { NeuralHandbook } from "./NeuralHandbook";
import { PrebuiltScripts } from "./PrebuiltScripts";
import { ReferencePanel } from "./ReferencePanel";

interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
    scriptId?: string | null;
    availableRobots: string[];
    onRobotChange: (id: string) => void;
}

const CommandConsoleComponent: React.FC<CommandConsoleProps> = ({ socket, robotId, scriptId, availableRobots, onRobotChange }) => {
    const {
        output, commandInput, setCommandInput, scriptInput, setScriptInput,
        isLibraryOpen, setIsLibraryOpen, activePrebuilt, setActivePrebuilt,
        appendScriptLine, handleCommandSubmit, handleDeployBrain
    } = useConsole(socket, robotId, scriptId);

    const [isZenMode, setIsZenMode] = useState(false);
    const [isLogsOpen, setIsLogsOpen] = useState(true);

    return (
        <div className={`transition-all duration-500 ease-out flex flex-col bg-black/70 backdrop-blur-xl border border-cyan-900/60 rounded-xl p-5 z-50 ${isZenMode ? "fixed top-24 bottom-8 left-8 w-[800px] border-cyan-500/50 shadow-[0_0_80px_rgba(34,211,238,0.2)]" : "h-full min-w-[420px] w-auto"}`} style={{ boxShadow: 'var(--card-shadow)' }}>

            {/* SENTIENT UPDATE Header */}
            <div className="flex justify-between items-center mb-4 border-b border-cyan-900/50 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_var(--accent)]"></span>
                    <span className="text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase">Sentient Update // ALISCRIPT V2.0</span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsZenMode(!isZenMode)}
                    className="group relative px-4 py-1.5 bg-black/50 border border-purple-500/50 text-purple-300 text-[10px] font-bold rounded uppercase tracking-widest hover:bg-purple-500/20 hover:border-purple-400 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] overflow-hidden"
                >
                    <span className="relative z-10">{isZenMode ? "Exit Zen Core" : "Enter Zen Mode"}</span>
                    <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
                </button>
            </div>

            {/* Override Console */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 mb-3 bg-black/40 border border-cyan-900/50 rounded p-2 focus-within:border-cyan-500/50 transition-colors shrink-0">
                <span className="text-cyan-500 font-bold ml-1">{'>'}</span>
                <input placeholder="Execute override (e.g. FIRE)" type="text" className="flex-grow bg-transparent outline-none text-cyan-300 text-xs font-mono placeholder-cyan-900" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} />
            </form>

            <div className="flex flex-row flex-grow overflow-hidden relative min-h-0">
                {/* Left Side: Editor & Terminal */}
                <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden relative">
                    {!isZenMode && <BotSelector availableRobots={availableRobots} robotId={robotId} onRobotChange={onRobotChange} />}

                    {/* ── Collapsible Terminal ──────────────────────────────── */}
                    {!isZenMode && (
                        <div className="shrink-0 border border-cyan-900/30 rounded overflow-hidden">
                            {/* Header toggle */}
                            <button
                                type="button"
                                onClick={() => setIsLogsOpen(v => !v)}
                                className="w-full flex items-center justify-between px-3 py-1.5 bg-black/40 hover:bg-cyan-950/40 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_var(--accent)]" />
                                    <span className="text-[10px] font-black tracking-widest text-cyan-600 uppercase">Telemetry Log</span>
                                    {output.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-900/50 text-cyan-400 border border-cyan-700/40">
                                            {output.length}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className="text-cyan-700 text-[10px] transition-transform duration-300"
                                    style={{ transform: isLogsOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                                >
                                    ▲
                                </span>
                            </button>

                            {/* Collapsible body — CSS max-height transition */}
                            <div
                                className="overflow-hidden transition-all duration-300 ease-in-out"
                                style={{ maxHeight: isLogsOpen ? '96px' : '0px' }}
                            >
                                <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '96px' }}>
                                    <TerminalOutput output={output} />
                                </div>
                            </div>
                        </div>
                    )}

                    <ScriptEditor
                        scriptInput={scriptInput}
                        setScriptInput={setScriptInput}
                        handleDeployBrain={() => handleDeployBrain(scriptInput)}
                        toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                        clearPrebuilt={() => setActivePrebuilt(null)}
                    />
                </div>

                {/* Right Side: Neural Handbook */}
                <NeuralHandbook
                    isOpen={isLibraryOpen}
                    onSelect={(cmd) => {
                        appendScriptLine(cmd);
                        setIsLibraryOpen(false);
                    }}
                />
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.5); }
            `}</style>
        </div>
    );
};

export const CommandConsole = memo(CommandConsoleComponent);
export default CommandConsole;