import React, { Dispatch, SetStateAction } from 'react';
import { ArenaControls } from '../ArenaControls';
import { BotSelector } from './BotSelector';
import { ScriptEditor } from './ScriptEditor';
import { NeuralHandbook } from './NeuralHandbook';

interface DesktopConsoleProps {
    isMobile: boolean;
    isZenMode: boolean;
    setIsZenMode: Dispatch<SetStateAction<boolean>>;
    commandInput: string;
    setCommandInput: (val: string) => void;
    handleCommandSubmit: (e: React.FormEvent) => void;
    output: React.ComponentProps<typeof ArenaControls>['output'];
    isLogsOpen: boolean;
    setIsLogsOpen: Dispatch<SetStateAction<boolean>>;
    availableRobots: string[];
    robotId: string;
    onRobotChange: (id: string) => void;
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: (script: string) => void;
    isLibraryOpen: boolean;
    setIsLibraryOpen: Dispatch<SetStateAction<boolean>>;
    setActivePrebuilt: (val: string | null) => void;
    appendScriptLine: (line: string) => void;
}

export const DesktopConsole: React.FC<DesktopConsoleProps> = ({
    isMobile, isZenMode, setIsZenMode, commandInput, setCommandInput, handleCommandSubmit,
    output, isLogsOpen, setIsLogsOpen, availableRobots, robotId, onRobotChange,
    scriptInput, setScriptInput, handleDeployBrain, isLibraryOpen, setIsLibraryOpen,
    setActivePrebuilt, appendScriptLine
}) => {
    return (
        <div
            className={`transition-all duration-500 ease-out flex flex-col bg-black/70 backdrop-blur-xl border border-cyan-900/60 rounded-xl p-5 z-50 ${isZenMode
                ? "fixed top-24 bottom-8 left-8 w-200 border-cyan-500/50 shadow-[0_0_80px_rgba(34,211,238,0.2)]"
                : "h-full min-w-105 w-auto"
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
                    <div className="absolute top-0 -left-full w-[50%] h-full bg-linear-to-r from-transparent via-purple-500/20 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
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

            <div className="flex flex-row grow overflow-visible relative min-h-0">
                <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-visible relative">
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
        </div>
    );
};
