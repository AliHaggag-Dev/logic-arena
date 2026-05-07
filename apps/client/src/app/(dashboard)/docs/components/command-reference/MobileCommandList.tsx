import { CATEGORY_COLORS } from '../../constants/docsData';

import type { CommandReferenceViewProps } from './types';

export function MobileCommandList({
    commands,
    totalCommands,
    expandedCommandKey,
    onCommandToggle,
}: Pick<
    CommandReferenceViewProps,
    'commands' | 'totalCommands' | 'expandedCommandKey' | 'onCommandToggle'
>) {
    return (
        <>
            <div className="flex flex-col gap-3 mt-4">
                {commands.map((command, index) => {
                    const categoryColor = CATEGORY_COLORS[command.category] ?? 'var(--accent)';
                    const commandKey = `${command.command}-${index}`;
                    const isExpanded = expandedCommandKey === commandKey;

                    return (
                        <div
                            key={commandKey}
                            className={`bg-card/60 border border-accent/10 rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-1 ring-accent/20' : ''}`}
                        >
                            <button
                                type="button"
                                onClick={() => onCommandToggle(commandKey)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <code className="text-accent font-black bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg text-[11px]">
                                        {command.command}
                                    </code>
                                    <span
                                        className="text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-full uppercase"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, ${categoryColor} 7%, transparent)`,
                                            border: `1px solid color-mix(in srgb, ${categoryColor} 19%, transparent)`,
                                            color: categoryColor,
                                        }}
                                    >
                                        {command.category}
                                    </span>
                                </div>
                                <span className={`text-[10px] text-accent/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-accent/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Energy Cost</div>
                                            <span className="text-[10px] font-black" style={{ color: categoryColor }}>
                                                {command.energyCost ?? 'Free'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Parameters</div>
                                            <code className="text-[10px] text-accent/60 font-mono italic">{command.parameters || 'NONE'}</code>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Description</div>
                                            <p className="text-[10px] text-text-primary/70 leading-relaxed font-medium">{command.description}</p>
                                        </div>
                                        <div className="bg-bg-primary/40 rounded-lg p-3 border border-accent/5">
                                            <div className="text-[9px] font-black text-accent/30 tracking-[0.2em] uppercase mb-1">Example</div>
                                            <code className="text-[10px] text-accent font-bold">{command.example}</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 text-[9px] text-accent/20 tracking-[0.2em] text-right font-bold">
                {commands.length} / {totalCommands} COMMANDS LISTED
            </div>
        </>
    );
}
