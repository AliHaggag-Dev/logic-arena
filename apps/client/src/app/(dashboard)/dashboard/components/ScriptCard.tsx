import React from "react";
import { Edit2, Users, Swords } from "lucide-react";

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
    isMobile?: boolean;
}

export const ScriptCard = ({ script, onEditBrain, onDeployToLobby, onDeployToArena, isMobile }: ScriptCardProps) => {
    if (isMobile) {
        return (
            <div 
                className="group relative flex flex-col w-full bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200"
                style={{ boxShadow: 'inset 3px 0 0 var(--accent), 0 1px 3px rgba(0,0,0,0.2)' }}
            >
                <div className="p-5 flex flex-col gap-1">
                    <h3 className="text-base font-bold text-accent tracking-wide group-active:text-accent/80">
                        {script.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary font-medium tracking-widest">
                        <span>v{script.version}</span>
                        <span className="opacity-30">·</span>
                        <span>{new Date(script.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                    </div>
                </div>
                
                <div className="px-5 pb-5 flex flex-row items-center gap-3">
                    <button
                        onClick={() => onEditBrain(script.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-accent/10 border border-accent/30 text-accent text-[10px] font-bold tracking-[0.1em] rounded-full active:bg-accent/20 transition-colors"
                    >
                        <Edit2 size={12} />
                        EDIT
                    </button>
                    <button
                        onClick={() => onDeployToLobby(script.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-secondary border border-border text-text-secondary text-[10px] font-bold tracking-[0.1em] rounded-full active:bg-border transition-colors"
                    >
                        <Users size={12} />
                        LOBBY
                    </button>
                    <button
                        onClick={() => onDeployToArena(script.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-accent/20 border border-accent/50 text-accent text-[10px] font-bold tracking-[0.1em] rounded-full active:scale-95 transition-all shadow-[0_0_10px_rgba(var(--accent-rgb),0.1)]"
                    >
                        <Swords size={12} />
                        ARENA
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-accent/20 hover:border-accent/50 hover:bg-accent/5 transition-colors duration-150 group" style={{ boxShadow: 'var(--card-shadow)' }}>
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
                    className="w-full sm:w-auto h-[36px] flex items-center justify-center px-4 bg-transparent border border-accent text-accent text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent/10 hover:border-accent hover:text-text-primary transition-colors duration-150 rounded-lg shadow-[0_0_10px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] whitespace-nowrap"
                >
                    Edit Script
                </button>
                <button
                    onClick={() => onDeployToLobby(script.id)}
                    className="w-full sm:w-auto h-[36px] flex items-center justify-center px-4 bg-transparent border border-accent text-accent text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent/10 hover:border-accent hover:text-text-primary transition-colors duration-150 rounded-lg shadow-[0_0_10px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] whitespace-nowrap"
                >
                    Deploy to Lobby
                </button>
                <button
                    onClick={() => onDeployToArena(script.id)}
                    className="w-full sm:w-auto h-[36px] flex items-center justify-center px-4 bg-accent/10 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent/30 hover:border-accent hover:text-text-primary transition-colors duration-150 rounded-lg shadow-[0_0_10px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] whitespace-nowrap"
                >
                    Deploy to Arena
                </button>
            </div>
        </div>
    );
};
