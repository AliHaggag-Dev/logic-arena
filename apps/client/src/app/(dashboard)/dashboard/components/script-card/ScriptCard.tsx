"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Pencil, Swords, Trophy, Trash2 } from "lucide-react";
import { RobotScript } from "./types";
import { ActionButton } from "./ActionButton";

interface ScriptCardProps {
    script: RobotScript;
    onEditBrain: (id: string) => void;
    onDeployToLobby: (id: string) => void;
    onDeployToArena: (id: string) => void;
    onDelete: (id: string) => void;
    onChangeMode: (id: string, newMode: "CLASSIC"|"TACTICAL"|"HYBRID") => void;
    isGuest?: boolean;
}

const CONFIRM_TIMEOUT_MS = 3000;

export const ScriptCard = React.memo(({
    script,
    onEditBrain,
    onDeployToLobby,
    onDeployToArena,
    onDelete,
    onChangeMode,
    isGuest,
}: ScriptCardProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const startConfirm = useCallback(() => {
        setConfirmDelete(true);
    }, []);

    const cancelConfirm = useCallback(() => {
        setConfirmDelete(false);
    }, []);

    const confirmAndDelete = useCallback(() => {
        setConfirmDelete(false);
        onDelete(script.id);
    }, [onDelete, script.id]);

    useEffect(() => {
        if (!confirmDelete) return;
        const timer = setTimeout(cancelConfirm, CONFIRM_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [confirmDelete, cancelConfirm]);

    const getActionRow = () => (
        <div className="flex justify-end">
            {confirmDelete ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-red-400 text-[9px] font-black tracking-widest uppercase">
                        SURE?
                    </span>
                    <div className="flex items-center p-0.5 bg-red-950/20 backdrop-blur-xl rounded-lg border border-red-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                        <button
                            type="button"
                            aria-label="Confirm delete"
                            onClick={confirmAndDelete}
                            className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[9px] font-black tracking-widest transition-all active:scale-95"
                        >
                            YES
                        </button>
                        <button
                            type="button"
                            aria-label="Cancel delete"
                            onClick={cancelConfirm}
                            className="px-2.5 py-1 rounded text-text-secondary hover:bg-accent/10 hover:text-text-primary text-[9px] font-black tracking-widest transition-all active:scale-95"
                        >
                            NO
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center p-0.5 bg-bg-secondary/60 backdrop-blur-2xl rounded-xl border border-accent/15 shadow-[inset_0_1px_1px_rgba(var(--accent-rgb),0.05),0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover:border-accent/30">
                    <ActionButton
                        icon={<Pencil size={14} strokeWidth={2.5} />}
                        tooltip={isGuest ? "LOCKED" : "EDIT SCRIPT"}
                        onClick={() => !isGuest && onEditBrain(script.id)}
                        disabled={isGuest}
                        colorClass="text-accent hover:text-accent hover:bg-accent/10"
                        glowColor="rgba(var(--accent-rgb), 0.4)"
                        borderColor="border-accent/30"
                    />
                    <div className="w-[1px] h-4 bg-accent/10 mx-0.5"></div>
                    <ActionButton
                        icon={<Swords size={14} strokeWidth={2.5} />}
                        tooltip={isGuest ? "LOCKED" : "DEPLOY TO LOBBY"}
                        onClick={() => !isGuest && onDeployToLobby(script.id)}
                        disabled={isGuest}
                        colorClass="text-purple-400 hover:text-purple-500 hover:bg-purple-500/10"
                        glowColor="rgba(168,85,247, 0.4)"
                        borderColor="border-purple-500/30"
                    />
                    <div className="w-[1px] h-4 bg-accent/10 mx-0.5"></div>
                    <ActionButton
                        icon={<Trophy size={14} strokeWidth={2.5} />}
                        tooltip="DEPLOY TO ARENA"
                        onClick={() => onDeployToArena(script.id)}
                        disabled={false}
                        colorClass="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        glowColor="rgba(34,197,94, 0.4)"
                        borderColor="border-green-500/30"
                    />
                    <div className="w-[1px] h-4 bg-accent/10 mx-0.5"></div>
                    <ActionButton
                        icon={<Trash2 size={14} strokeWidth={2.5} />}
                        tooltip={isGuest ? "LOCKED" : "DELETE SCRIPT"}
                        onClick={() => !isGuest && startConfirm()}
                        disabled={isGuest}
                        colorClass="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        glowColor="rgba(239,68,68, 0.4)"
                        borderColor="border-red-500/30"
                    />
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Card */}
            <div className="md:hidden group relative flex flex-col gap-3 w-full bg-card/45 backdrop-blur-xl p-4 px-5 rounded-xl border border-accent/25 overflow-hidden transition-all duration-200 pl-6" style={{ boxShadow: "inset 3px 0 0 var(--accent), 0 1px 3px rgba(0,0,0,0.2)" }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/40 rounded-l-xl" />
                <div className="flex flex-col gap-1 min-w-0 w-full relative z-20">
                    <h3 className="text-sm font-black text-accent tracking-wide group-active:text-accent/80 truncate break-words whitespace-normal leading-tight">
                        {script.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary font-bold tracking-widest mt-0.5">
                        <span className="bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10 text-accent">v{script.version}</span>
                        <ScriptModeSelector 
                            currentMode={script.matchMode as any || "HYBRID"} 
                            onChange={(m) => onChangeMode(script.id, m)} 
                        />
                        <span className="opacity-30">·</span>
                        <span className="truncate">
                            {mounted ? new Date(script.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" }) : ""}
                        </span>
                    </div>
                </div>
                <div className="shrink-0 w-full pt-2 border-t border-accent/10 flex justify-end">
                    {getActionRow()}
                </div>
            </div>

            {/* Desktop Legendary Card */}
            <div className="hidden md:flex flex-col gap-3 bg-card/20 backdrop-blur-xl p-4 px-5 rounded-2xl border border-accent/15 hover:border-accent/40 hover:bg-card/40 transition-all duration-500 group shadow-[var(--card-shadow)] hover:shadow-[0_8px_32px_rgba(var(--accent-rgb),0.15)] hover:-translate-y-0.5 relative overflow-hidden pl-6 cursor-default">
                {/* Left accent glowing line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent/20 rounded-l-2xl group-hover:bg-accent group-hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)] transition-all duration-500" />

                <div className="flex flex-col gap-1 w-full relative z-20">
                    <h3 className="text-sm lg:text-base font-black text-text-primary tracking-widest group-hover:text-accent transition-colors duration-300 break-words line-clamp-2 leading-tight uppercase drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">
                        {script.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[9px] lg:text-[10px] text-text-secondary tracking-[0.2em] font-black uppercase mt-1">
                        <span className="bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20 group-hover:bg-accent/20 group-hover:border-accent/40 transition-colors">V.{script.version}</span>
                        <ScriptModeSelector 
                            currentMode={script.matchMode as any || "HYBRID"} 
                            onChange={(m) => onChangeMode(script.id, m)} 
                        />
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="truncate">INIT: {mounted ? new Date(script.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                </div>

                <div className="w-full shrink-0 z-10 mt-1 pt-3 border-t border-white/5 group-hover:border-accent/20 transition-colors duration-500 flex justify-end">
                    {getActionRow()}
                </div>
            </div>
        </>
    );
});

ScriptCard.displayName = "ScriptCard";

const ScriptModeSelector = ({ 
    currentMode, 
    onChange, 
    disabled 
}: { 
    currentMode: "CLASSIC" | "TACTICAL" | "HYBRID", 
    onChange: (mode: "CLASSIC" | "TACTICAL" | "HYBRID") => void,
    disabled?: boolean 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = ["HYBRID", "CLASSIC", "TACTICAL"] as const;

    return (
        <div className="relative" onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsOpen(false);
            }
        }}>
            <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all uppercase flex items-center gap-1 group ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                {currentMode}
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isOpen && (
                <div className="absolute z-[100] top-full left-0 mt-1.5 bg-bg-primary border border-purple-500/30 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden min-w-[100px] animate-in fade-in zoom-in-95 duration-150">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-[9px] font-black tracking-widest uppercase transition-colors cursor-pointer ${currentMode === opt ? "bg-purple-500/20 text-purple-700 dark:text-purple-400" : "text-text-secondary hover:!bg-purple-500/20 hover:!text-purple-700 dark:hover:!text-purple-400"}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
