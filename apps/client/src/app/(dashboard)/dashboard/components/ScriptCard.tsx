import React from "react";

export interface RobotScript {
    id: string;
    title: string;
    content: string;
    version: number;
    createdAt: string;
}

interface ScriptCardProps {
    script: RobotScript;
    onEditBrain: (id: string) => void;
    onDeployToLobby: (id: string) => void;
    onDeployToArena: (id: string) => void;
}

export const ScriptCard = ({ script, onEditBrain, onDeployToLobby, onDeployToArena }: ScriptCardProps) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-accent/20 hover:border-accent/50 hover:bg-accent/5 transition-all group" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="flex flex-col gap-1 w-full">
                <h3 className="text-base sm:text-lg font-bold text-accent tracking-wider group-hover:text-accent transition-colors break-words">
                    {script.title}
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-[10px] text-text-secondary tracking-widest font-bold">
                    <span>V.{script.version}</span>
                    <span className="hidden sm:inline">|</span>
                    <span>INIT: {new Date(script.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button
                    onClick={() => onEditBrain(script.id)}
                    className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-transparent border border-accent text-accent text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent/10 hover:border-accent hover:text-text-primary transition-all rounded shadow-[0_0_10px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] whitespace-nowrap"
                >
                    Edit Script
                </button>
                <button
                    onClick={() => onDeployToLobby(script.id)}
                    className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-transparent border border-accent text-accent text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent/10 hover:border-accent hover:text-text-primary transition-all rounded shadow-[0_0_10px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] whitespace-nowrap"
                >
                    Deploy to Lobby
                </button>
                <button
                    onClick={() => onDeployToArena(script.id)}
                    className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-accent/10 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent/30 hover:border-accent hover:text-text-primary transition-all rounded shadow-[0_0_10px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] whitespace-nowrap"
                >
                    Deploy to Arena
                </button>
            </div>
        </div>
    );
};
