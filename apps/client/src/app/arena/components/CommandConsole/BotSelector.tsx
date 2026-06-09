import React from "react";

interface BotSelectorProps {
    availableRobots: string[];
    robotId: string;
    onRobotChange: (id: string) => void;
    isMobile?: boolean;
}

export const BotSelector: React.FC<BotSelectorProps> = ({ availableRobots, robotId, onRobotChange, isMobile }) => {
    if (availableRobots.length <= 1) return null;

    return (
        <div className={`flex ${isMobile ? 'flex-col gap-1' : 'gap-2 mb-4 border-b border-cyan-900/60 pb-3'}`}>
        {availableRobots.map(id => (
            <button
                type="button"
                key={id}
                onClick={() => onRobotChange(id)}
                className={`px-4 py-2 text-xs font-bold tracking-widest transition-all ${isMobile ? 'rounded-lg' : 'clip-edges'} ${robotId === id
                    ? `bg-cyan-500/15 text-cyan-300 ${isMobile ? 'border-l-2' : 'border-b-2'} border-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)]`
                    : "bg-transparent text-cyan-800 hover:text-cyan-500 hover:bg-cyan-950/30"
                    } ${isMobile ? 'text-left w-full' : ''}`}
            >
                {id.toUpperCase()}
            </button>
        ))}
        </div>
    );
};