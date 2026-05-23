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
    isGuest?: boolean;
}

const CONFIRM_TIMEOUT_MS = 3000;

export const ScriptCard = React.memo(({
    script,
    onEditBrain,
    onDeployToLobby,
    onDeployToArena,
    onDelete,
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
            <div className="md:hidden group relative flex items-center justify-between w-full bg-card/45 backdrop-blur-xl p-3 px-4 rounded-xl border border-accent/25 overflow-hidden transition-all duration-200 pl-6" style={{ boxShadow: "inset 3px 0 0 var(--accent), 0 1px 3px rgba(0,0,0,0.2)" }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/40 rounded-l-xl" />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
                    <h3 className="text-sm font-black text-accent tracking-wide group-active:text-accent/80 truncate">
                        {script.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[9px] text-text-secondary font-bold tracking-widest">
                        <span className="bg-accent/5 px-1 py-0.2 rounded border border-accent/10 text-accent">v{script.version}</span>
                        <span className="opacity-30">·</span>
                        <span className="truncate">
                            {mounted ? new Date(script.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" }) : ""}
                        </span>
                    </div>
                </div>
                <div className="shrink-0 z-10">
                    {getActionRow()}
                </div>
            </div>

            {/* Desktop Card */}
            <div className="hidden md:flex items-center justify-between bg-card/40 backdrop-blur-xl p-3.5 px-5 rounded-2xl border border-accent/15 hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 group shadow-[var(--card-shadow)] hover:scale-[1.01] relative overflow-hidden pl-7">
                {/* Left accent glowing line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/20 rounded-l-2xl group-hover:bg-accent group-hover:shadow-[0_0_10px_rgba(var(--accent-rgb),0.6)] transition-all duration-300" />
                
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-4">
                    <h3 className="text-sm font-black text-text-primary tracking-wider group-hover:text-accent transition-all duration-300 truncate wrap-break-word group-hover:drop-shadow-[0_0_6px_rgba(var(--accent-rgb),0.4)]">
                        {script.title}
                    </h3>
                    <div className="flex items-center gap-2.5 text-[9px] text-text-secondary tracking-widest font-black uppercase">
                        <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-md border border-accent/15 transition-all group-hover:bg-accent/20 group-hover:border-accent/30">V.{script.version}</span>
                        <span className="opacity-30">•</span>
                        <span className="truncate">INIT: {mounted ? new Date(script.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                </div>

                <div className="shrink-0 z-10">
                    {getActionRow()}
                </div>
            </div>
        </>
    );
});

ScriptCard.displayName = "ScriptCard";
