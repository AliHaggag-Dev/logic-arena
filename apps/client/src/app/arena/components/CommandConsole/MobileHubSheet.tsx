import React, { Dispatch, SetStateAction } from 'react';
import { Settings, Bot, BookOpen, Sparkles } from 'lucide-react';
import { ArenaControls } from '../ArenaControls';
import { BotSelector } from './BotSelector';
import { NeuralHandbook } from './NeuralHandbook';
import { AiGeneratePanel } from './AiGeneratePanel';

interface MobileHubSheetProps {
    isMobile: boolean;
    hubTab: 'logs' | 'handbook' | 'generate';
    setHubTab: Dispatch<SetStateAction<'logs' | 'handbook' | 'generate'>>;
    commandInput: string;
    setCommandInput: (val: string) => void;
    handleCommandSubmit: (e: React.FormEvent) => void;
    output: React.ComponentProps<typeof ArenaControls>['output'];
    isLogsOpen: boolean;
    setIsLogsOpen: Dispatch<SetStateAction<boolean>>;
    availableRobots: string[];
    robotId: string;
    onRobotChange: (id: string) => void;
    onInsertAndSwitch?: (snippet: string) => void;
}

export const MobileHubSheet: React.FC<MobileHubSheetProps> = ({
    isMobile, hubTab, setHubTab, commandInput, setCommandInput, handleCommandSubmit,
    output, isLogsOpen, setIsLogsOpen, availableRobots, robotId, onRobotChange, onInsertAndSwitch
}) => {
    const tabs = [
        { id: 'logs'     as const, label: 'LOGS',     icon: <Settings className="w-3.5 h-3.5" /> },
        { id: 'handbook' as const, label: 'COOKBOOK', icon: <BookOpen className="w-3.5 h-3.5" /> },
        { id: 'generate' as const, label: 'AI GEN',   icon: <Sparkles className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="flex flex-col gap-3 w-full flex-1 min-h-0">
            {/* Tab Bar */}
            <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-cyan-900/30 shrink-0">
                {tabs.map((tab) => (
                    <button
                        title={tab.label}
                        type="button"
                        key={tab.id}
                        onClick={() => setHubTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase transition-all duration-200 ${hubTab === tab.id
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                            : 'text-cyan-700 hover:text-cyan-500 border border-transparent'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 flex flex-col">
                {hubTab === 'logs' && (
                    <div className="flex-1 min-h-0 flex flex-row gap-3">
                        <div className="w-[45%] flex flex-col min-h-0 border-r border-cyan-900/30 pr-2">
                            <BotSelector
                                availableRobots={availableRobots}
                                robotId={robotId}
                                onRobotChange={onRobotChange}
                                isMobile={isMobile}
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 pl-1">
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
                    </div>
                )}
                {hubTab === 'handbook' && (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <NeuralHandbook
                            isOpen={true}
                            fullWidth={true}
                            onSelect={(cmd) => {
                                onInsertAndSwitch?.(cmd);
                            }}
                        />
                    </div>
                )}
                {hubTab === 'generate' && (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <AiGeneratePanel
                            isMobile
                            isArena
                            onInsert={(code) => {onInsertAndSwitch?.(code)}}
                            onInsertAndSwitch={(code) => onInsertAndSwitch?.(code)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
