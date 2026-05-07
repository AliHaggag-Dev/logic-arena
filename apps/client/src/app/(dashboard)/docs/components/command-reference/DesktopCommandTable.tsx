import { CATEGORY_COLORS } from '../../constants/docsData';

import type { CommandReferenceViewProps } from './types';

const TABLE_HEADERS = ['Command', 'Category', 'Energy', 'Parameters', 'Description', 'Example'];

export function DesktopCommandTable({
    commands,
    totalCommands,
}: Pick<CommandReferenceViewProps, 'commands' | 'totalCommands'>) {
    return (
        <>
            <div className="rounded-xl border border-accent/10 overflow-hidden bg-card/60 backdrop-blur-md" style={{ boxShadow: 'var(--card-shadow)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[10px] tracking-[0.08em]">
                        <thead>
                            <tr className="border-b border-accent/10 bg-accent/5">
                                {TABLE_HEADERS.map((header) => (
                                    <th
                                        key={header}
                                        className="px-[18px] py-[14px] text-left text-[9px] font-bold tracking-[0.25em] text-accent/35 uppercase whitespace-nowrap"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {commands.map((command, index) => {
                                const categoryColor = CATEGORY_COLORS[command.category] ?? 'var(--accent)';

                                return (
                                    <tr
                                        key={`${command.command}-${index}`}
                                        className="cmd-row hover:bg-accent/5 transition-colors duration-150"
                                        style={{
                                            borderBottom: index < commands.length - 1 ? '1px solid rgba(var(--accent-rgb),0.05)' : 'none',
                                        }}
                                    >
                                        <td className="px-[18px] py-[14px]">
                                            <code className="text-accent font-bold bg-accent/5 border border-accent/15 px-2 py-1 rounded text-[10px] whitespace-nowrap">
                                                {command.command}
                                            </code>
                                        </td>
                                        <td className="px-[18px] py-[14px]">
                                            <span
                                                className="inline-block px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.15em] whitespace-nowrap"
                                                style={{
                                                    backgroundColor: `color-mix(in srgb, ${categoryColor} 7%, transparent)`,
                                                    border: `1px solid color-mix(in srgb, ${categoryColor} 19%, transparent)`,
                                                    color: categoryColor,
                                                }}
                                            >
                                                {command.category.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-[18px] py-[14px] whitespace-nowrap">
                                            <span className="text-[10px] font-black" style={{ color: categoryColor }}>
                                                {command.energyCost ?? 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-[18px] py-[14px] text-accent/35 text-[10px] whitespace-nowrap">
                                            {command.parameters}
                                        </td>
                                        <td className="px-[18px] py-[14px] text-accent/60 leading-relaxed min-w-[240px]">
                                            {command.description}
                                        </td>
                                        <td className="px-[18px] py-[14px]">
                                            <code className="text-accent/50 text-[10px] whitespace-nowrap">
                                                {command.example}
                                            </code>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-3 text-[9px] text-accent/20 tracking-[0.18em] text-right">
                {commands.length} / {totalCommands} COMMANDS DISPLAYED
            </div>
        </>
    );
}
