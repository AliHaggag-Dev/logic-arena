import React from "react";

interface BotSelectorProps {
    availableRobots: string[];
    robotId: string;
    onRobotChange: (id: string) => void;
}

export const BotSelector: React.FC<BotSelectorProps> = ({ availableRobots, robotId, onRobotChange }) => {
    if (availableRobots.length <= 1) return null;

    return (
        <div className="flex gap-2 mb-4 border-b border-cyan-900/60 pb-3">
        {availableRobots.map(id => (
            <button
                type="button"
                key={id}
                onClick={() => onRobotChange(id)}
                className={`px-4 py-1.5 text-xs font-bold tracking-widest transition-all clip-edges ${robotId === id
                    ? "bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    : "bg-transparent text-cyan-800 hover:text-cyan-500 hover:bg-cyan-950/30"
                    }`}
            >
                {id.toUpperCase()}
            </button>
        ))}
        </div>
    );
};