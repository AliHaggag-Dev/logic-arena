import React, { Dispatch, SetStateAction } from 'react';
import { ArenaControls } from '../ArenaControls';
import { BotSelector } from './BotSelector';
import { NeuralHandbook } from './NeuralHandbook';

interface MobileHubSheetProps {
    isMobile: boolean;
    hubTab: 'controls' | 'bots' | 'handbook';
    setHubTab: Dispatch<SetStateAction<'controls' | 'bots' | 'handbook'>>;
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
                        title={tab.label}
                        type="button"
                        key={tab.id}
                        onClick={() => setHubTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase transition-all duration-200 ${hubTab === tab.id
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
};
