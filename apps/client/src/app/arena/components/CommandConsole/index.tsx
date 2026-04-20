import React, { memo, useState } from "react";
import { Socket } from "socket.io-client";
import { useConsole } from "../../hooks/useConsole";
import { BotSelector } from "./BotSelector";
import { ScriptEditor } from "./ScriptEditor";
import { NeuralHandbook } from "./NeuralHandbook";
import { ArenaControls } from "../ArenaControls";

interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
    scriptId?: string | null;
    availableRobots: string[];
    onRobotChange: (id: string) => void;
    isMobile: boolean;
    mobileSheet?: 'controls' | 'script'; // which sheet is this instance for
}

const CommandConsoleComponent: React.FC<CommandConsoleProps> = ({
    socket, robotId, scriptId, availableRobots, onRobotChange, isMobile, mobileSheet
}) => {
    const {
        output, commandInput, setCommandInput, scriptInput, setScriptInput,
        isLibraryOpen, setIsLibraryOpen, activePrebuilt, setActivePrebuilt,
        appendScriptLine, handleCommandSubmit, handleDeployBrain
    } = useConsole(socket, robotId, scriptId);

    const [isZenMode, setIsZenMode] = useState(false);
    const [isLogsOpen, setIsLogsOpen] = useState(true);

    // ── MOBILE: CONTROLS sheet ────────────────────────────────────────────────
    if (isMobile && mobileSheet === 'controls') {
        return (
            <div className="flex flex-col gap-3 w-full">
                <ArenaControls
                    isMobile={isMobile}
                    commandInput={commandInput}
                    setCommandInput={setCommandInput}
                    handleCommandSubmit={handleCommandSubmit}
                    output={output}
                    isLogsOpen={isLogsOpen}
                    setIsLogsOpen={setIsLogsOpen}
                />
                <BotSelector
                    availableRobots={availableRobots}
                    robotId={robotId}
                    onRobotChange={onRobotChange}
                />
            </div>
        );
    }

    // ── MOBILE: SCRIPT sheet ──────────────────────────────────────────────────
    if (isMobile && mobileSheet === 'script') {
        return (
            <div className="flex flex-col gap-3 w-full h-full">
                {/* ZEN MODE always on — full editor experience */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                        <span className="text-purple-300 text-[9px] font-black tracking-[0.3em] uppercase">AliScript_V2 // Zen Core</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                        className="px-2 py-1 bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-purple-500/20 transition-all"
                    >
                        {isLibraryOpen ? '← Editor' : 'Handbook →'}
                    </button>
                </div>

                <div className="flex flex-row flex-1 gap-2 overflow-hidden min-h-0">
                    {!isLibraryOpen ? (
                        <ScriptEditor
                            scriptInput={scriptInput}
                            setScriptInput={setScriptInput}
                            handleDeployBrain={() => handleDeployBrain(scriptInput)}
                            toggleLibrary={() => setIsLibraryOpen(true)}
                            clearPrebuilt={() => setActivePrebuilt(null)}
                        />
                    ) : (
                        <div className="flex-1 overflow-hidden">
                            <NeuralHandbook
                                isOpen={true}
                                onSelect={(cmd) => {
                                    appendScriptLine(cmd);
                                    setIsLibraryOpen(false);
                                }}
                            />
                        </div>
                    )}
                </div>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }
                `}</style>
            </div>
        );
    }

    // ── DESKTOP: full panel ───────────────────────────────────────────────────
    return (
        <div
            className={`transition-all duration-500 ease-out flex flex-col bg-black/70 backdrop-blur-xl border border-cyan-900/60 rounded-xl p-5 z-50 ${isZenMode
                ? "fixed top-24 bottom-8 left-8 w-[800px] border-cyan-500/50 shadow-[0_0_80px_rgba(34,211,238,0.2)]"
                : "h-full min-w-[420px] w-auto"
                }`}
            style={{ boxShadow: 'var(--card-shadow)' }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-cyan-900/50 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_var(--accent)]" />
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

            <div className="mb-4">
                <ArenaControls
                    isMobile={isMobile}
                    commandInput={commandInput}
                    setCommandInput={setCommandInput}
                    handleCommandSubmit={handleCommandSubmit}
                    output={output}
                    isLogsOpen={isLogsOpen}
                    setIsLogsOpen={setIsLogsOpen}
                />
            </div>

            <div className="flex flex-row flex-grow overflow-hidden relative min-h-0">
                <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden relative">
                    {!isZenMode && (
                        <BotSelector
                            availableRobots={availableRobots}
                            robotId={robotId}
                            onRobotChange={onRobotChange}
                        />
                    )}
                    <ScriptEditor
                        scriptInput={scriptInput}
                        setScriptInput={setScriptInput}
                        handleDeployBrain={() => handleDeployBrain(scriptInput)}
                        toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                        clearPrebuilt={() => setActivePrebuilt(null)}
                    />
                </div>
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
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.5); }
            `}</style>
        </div>
    );
};

export const CommandConsole = memo(CommandConsoleComponent);
export default CommandConsole;