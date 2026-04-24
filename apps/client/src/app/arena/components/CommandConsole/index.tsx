import React, { memo, useState, useEffect, useRef } from "react";
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
    mobileSheet?: 'controls' | 'script';
    onDeployDone?: () => void;
    onInsertAndSwitch?: (snippet: string) => void;
    consumeSnippet?: () => string | null;
    snippetVersion?: number;
}

const CommandConsoleComponent: React.FC<CommandConsoleProps> = ({
    socket, robotId, scriptId, availableRobots, onRobotChange, isMobile, mobileSheet,
    onDeployDone, onInsertAndSwitch, consumeSnippet, snippetVersion
}) => {
    const {
        output, commandInput, setCommandInput, scriptInput, setScriptInput,
        isLibraryOpen, setIsLibraryOpen, activePrebuilt, setActivePrebuilt,
        appendScriptLine, handleCommandSubmit, handleDeployBrain
    } = useConsole(socket, robotId, scriptId);

    const [isZenMode, setIsZenMode] = useState(false);
    const [isLogsOpen, setIsLogsOpen] = useState(true);
    const [hubTab, setHubTab] = useState<'controls' | 'bots' | 'handbook'>('controls');

    // Pick up pending snippet from HUB when ZEN_CORE opens
    const lastSnippetVersion = useRef(snippetVersion ?? 0);
    useEffect(() => {
        if (mobileSheet === 'script' && consumeSnippet && snippetVersion !== undefined && snippetVersion > lastSnippetVersion.current) {
            lastSnippetVersion.current = snippetVersion;
            const snippet = consumeSnippet();
            if (snippet) {
                appendScriptLine(snippet);
            }
        }
    }, [mobileSheet, snippetVersion, consumeSnippet, appendScriptLine]);

    // ── MOBILE: CONTROLS sheet (📟 HUB — tabbed: Controls / Bots / Handbook) ──
    if (isMobile && mobileSheet === 'controls') {
        const tabs = [
            { id: 'controls' as const, label: 'CONTROLS', icon: '⚙' },
            { id: 'bots' as const, label: 'BOTS', icon: '🤖' },
            { id: 'handbook' as const, label: 'HANDBOOK', icon: '📖' },
        ];

        return (
            <div className="flex flex-col gap-3 w-full flex-1 min-h-0">
                {/* Tab Bar */}
                <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-cyan-900/30 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setHubTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase transition-all duration-200 ${
                                hubTab === tab.id
                                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                                    : 'text-cyan-700 hover:text-cyan-500 border border-transparent'
                            }`}
                        >
                            <span className="text-xs">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {hubTab === 'controls' && (
                        <ArenaControls
                            isMobile={isMobile}
                            commandInput={commandInput}
                            setCommandInput={setCommandInput}
                            handleCommandSubmit={handleCommandSubmit}
                            output={output}
                            isLogsOpen={isLogsOpen}
                            setIsLogsOpen={setIsLogsOpen}
                        />
                    )}
                    {hubTab === 'bots' && (
                        <BotSelector
                            availableRobots={availableRobots}
                            robotId={robotId}
                            onRobotChange={onRobotChange}
                        />
                    )}
                    {hubTab === 'handbook' && (
                        <div className="flex-1 overflow-hidden">
                            <NeuralHandbook
                                isOpen={true}
                                fullWidth={true}
                                onSelect={(cmd) => {
                                    onInsertAndSwitch?.(cmd);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── MOBILE: SCRIPT sheet (⚡ ZEN CORE — pure editor) ─────────────────────
    if (isMobile && mobileSheet === 'script') {
        return (
            <div className="flex flex-col gap-3 w-full flex-1 min-h-0">
                {/* Zen header */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                    <span className="text-purple-300 text-[9px] font-black tracking-[0.3em] uppercase">AliScript_V2 // Zen Core</span>
                </div>

                {/* Editor fills all space */}
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <ScriptEditor
                        scriptInput={scriptInput}
                        setScriptInput={setScriptInput}
                        handleDeployBrain={() => {
                            handleDeployBrain(scriptInput);
                            onDeployDone?.();
                        }}
                        toggleLibrary={() => setIsLibraryOpen(true)}
                        clearPrebuilt={() => setActivePrebuilt(null)}
                    />
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