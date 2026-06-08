import React, { Dispatch, SetStateAction, useState } from 'react';
import { ArenaControls } from '../ArenaControls';
import { BotSelector } from './BotSelector';
import { ScriptEditor } from './ScriptEditor';
import { NeuralHandbook, Recipe, DIFFICULTY_STYLES, CodeLine } from './NeuralHandbook';
import { WordLevelEditor } from '../WordLevelEditor';
import { EditorCombatOverlay } from '../Tactical/EditorCombatOverlay';
import { BreakControls } from '../Tactical/BreakControls';

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
    isClassicMode?: boolean;
    classicTokensLeft?: number;
    classicMaxTokens?: number;
    onClassicEdit?: (script: string, tokensLeft: number) => void;
    displayMode?: string;
    matchPhase?: string;
}

export const DesktopConsole: React.FC<DesktopConsoleProps> = ({
    isMobile, isZenMode, setIsZenMode, commandInput, setCommandInput, handleCommandSubmit,
    output, isLogsOpen, setIsLogsOpen, availableRobots, robotId, onRobotChange,
    scriptInput, setScriptInput, handleDeployBrain, isLibraryOpen, setIsLibraryOpen,
    setActivePrebuilt, appendScriptLine, isClassicMode = false, classicTokensLeft = 0,
    classicMaxTokens, onClassicEdit, displayMode, matchPhase
}) => {
    const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
    const [isReady, setIsReady] = useState(false);

    return (
        <div
            className={`relative transition-all duration-500 ease-out flex flex-col bg-black/70 backdrop-blur-xl border border-cyan-900/60 rounded-xl p-5 z-50 ${isZenMode
                ? "h-full w-200 border-cyan-500/50 shadow-[0_0_80px_rgba(34,211,238,0.2)]"
                : "h-full min-w-105 w-auto"
                }`}
            style={{ boxShadow: 'var(--card-shadow)' }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-cyan-900/50 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_var(--accent)]" />
                    <span className="text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase font-sans">ALISCRIPT</span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsZenMode(!isZenMode)}
                    className="group relative px-4 py-1.5 bg-black/50 border border-purple-500/50 text-purple-300 text-[10px] font-bold rounded uppercase tracking-widest hover:bg-purple-500/20 hover:border-purple-400 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] overflow-hidden cursor-pointer"
                >
                    <span className="relative z-10">{isZenMode ? "Exit Zen" : "Zen Mode"}</span>
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
                    {isClassicMode && onClassicEdit ? (
                        <WordLevelEditor
                            script={scriptInput}
                            tokensLeft={classicTokensLeft}
                            maxTokens={classicMaxTokens}
                            onChange={(nextScript, nextTokensLeft) => {
                                setScriptInput(nextScript);
                                onClassicEdit(nextScript, nextTokensLeft);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col min-h-0 grow relative">
                            {displayMode === 'TACTICAL' && (
                                <EditorCombatOverlay isActive={matchPhase === 'ROUND_ACTIVE'} />
                            )}
                            <ScriptEditor
                                scriptInput={scriptInput}
                                setScriptInput={setScriptInput}
                                handleDeployBrain={() => handleDeployBrain(scriptInput)}
                                toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
                                clearPrebuilt={() => setActivePrebuilt(null)}
                                isLibraryOpen={isLibraryOpen}
                            />
                            {displayMode === 'TACTICAL' && (
                                <BreakControls 
                                    isActive={matchPhase === 'BREAK'}
                                    isReady={isReady}
                                    opponentReady={false} // Placeholder until backend is wired
                                    onToggleReady={() => setIsReady(!isReady)}
                                />
                            )}
                        </div>
                    )}
                </div>
                <NeuralHandbook
                    isOpen={isLibraryOpen}
                    onSelect={(cmd) => {
                        appendScriptLine(cmd);
                        setIsLibraryOpen(false);
                    }}
                    onExpandRecipe={setActiveRecipe}
                />

            </div>

            {activeRecipe && (
                <div 
                    className="absolute left-5 right-5 bottom-5 z-50 flex flex-col overflow-hidden animate-[modalIn_0.2s_ease-out]"
                    style={{
                        top: "60px",
                        background: "rgba(var(--arena-black-rgb),0.94)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(var(--arena-cyan-rgb),0.4)",
                        borderRadius: "10px",
                        padding: "12px 16px",
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-cyan-900/30 pb-2 mb-2 shrink-0">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[11px] font-black tracking-widest text-cyan-400 uppercase">
                                    {activeRecipe.name}
                                </h4>
                                <span style={{
                                    fontSize: "7.5px",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    color: DIFFICULTY_STYLES[activeRecipe.difficulty].color,
                                    background: DIFFICULTY_STYLES[activeRecipe.difficulty].bg,
                                }}>
                                    {DIFFICULTY_STYLES[activeRecipe.difficulty].label}
                                </span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 leading-normal max-w-[500px]">
                                {activeRecipe.description}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveRecipe(null)}
                            className="text-cyan-400 hover:text-white text-[9px] font-bold px-2.5 py-0.5 rounded border border-cyan-500/20 hover:border-cyan-400 transition-colors cursor-pointer"
                        >
                            CLOSE
                        </button>
                    </div>
                    
                    {/* Scrollable Code Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-black/40 border border-cyan-900/20 rounded-lg p-3">
                        <pre className="font-mono text-[11px] leading-relaxed text-cyan-100">
                            {activeRecipe.code.split("\n").map((line, i) => (
                                <CodeLine key={i} line={line} />
                            ))}
                        </pre>
                    </div>
                    
                    {/* Footer Action Button */}
                    <div className="flex justify-end mt-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                appendScriptLine(activeRecipe.code);
                                setIsLibraryOpen(false);
                                setActiveRecipe(null);
                            }}
                            className="py-2 px-5 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 font-black text-[9px] hover:bg-cyan-600/25 hover:border-cyan-400 transition-all rounded uppercase tracking-widest cursor-pointer"
                        >
                            Insert into Editor
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
