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
        <div className="mt-4 flex justify-end">
            {confirmDelete ? (
                <div className="flex items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-red-400 text-[10px] md:text-xs font-black tracking-[0.15em] uppercase flex-1 text-right mr-1 md:mr-2">
                        CONFIRM DELETE?
                    </span>
                    <div className="flex items-center p-1 bg-red-950/20 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-[inset_0_1px_1px_rgba(var(--accent-rgb),0.05)]">
                        <button
                            type="button"
                            aria-label="Confirm delete"
                            onClick={confirmAndDelete}
                            className="flex items-center justify-center px-5 py-2 md:py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[10px] md:text-xs font-black tracking-widest transition-all active:scale-95"
                        >
                            YES
                        </button>
                        <div className="w-[1px] h-5 bg-red-500/20 mx-1"></div>
                        <button
                            type="button"
                            aria-label="Cancel delete"
                            onClick={cancelConfirm}
                            className="flex items-center justify-center px-5 py-2 md:py-2.5 rounded-xl text-text-secondary hover:bg-accent/10 hover:text-text-primary text-[10px] md:text-xs font-black tracking-widest transition-all active:scale-95"
                        >
                            NO
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center p-1 bg-card/60 backdrop-blur-2xl rounded-2xl border border-accent/10 shadow-[inset_0_1px_1px_rgba(var(--accent-rgb),0.05),0_8px_32px_rgba(0,0,0,0.1)]">
                    <ActionButton
                        icon={<Pencil size={18} strokeWidth={2} />}
                        tooltip={isGuest ? "LOCKED" : "EDIT SCRIPT"}
                        onClick={() => !isGuest && onEditBrain(script.id)}
                        disabled={isGuest}
                        colorClass="text-accent hover:text-accent hover:bg-accent/10"
                        glowColor="rgba(var(--accent-rgb), 0.4)"
                        borderColor="border-accent/30"
                    />
                    <div className="w-[1px] h-6 bg-accent/10 mx-0.5"></div>
                    <ActionButton
                        icon={<Swords size={18} strokeWidth={2} />}
                        tooltip={isGuest ? "LOCKED" : "DEPLOY TO LOBBY"}
                        onClick={() => !isGuest && onDeployToLobby(script.id)}
                        disabled={isGuest}
                        colorClass="text-purple-400 hover:text-purple-500 hover:bg-purple-500/10"
                        glowColor="rgba(168,85,247, 0.4)"
                        borderColor="border-purple-500/30"
                    />
                    <div className="w-[1px] h-6 bg-accent/10 mx-0.5"></div>
                    <ActionButton
                        icon={<Trophy size={18} strokeWidth={2} />}
                        tooltip="DEPLOY TO ARENA"
                        onClick={() => onDeployToArena(script.id)}
                        disabled={false}
                        colorClass="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        glowColor="rgba(34,197,94, 0.4)"
                        borderColor="border-green-500/30"
                    />
                    <div className="w-[1px] h-6 bg-accent/10 mx-0.5"></div>
                    <ActionButton
                        icon={<Trash2 size={18} strokeWidth={2} />}
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
            <div className="md:hidden group relative flex flex-col w-full bg-card border border-accent/50 rounded-2xl overflow-hidden transition-all duration-200" style={{ boxShadow: "inset 3px 0 0 var(--accent), 0 1px 3px rgba(0,0,0,0.2)" }}>
                <div className="p-5 flex flex-col gap-1">
                    <h3 className="text-base font-bold text-accent tracking-wide group-active:text-accent/80">
                        {script.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary font-medium tracking-widest">
                        <span>v{script.version}</span>
                        <span className="opacity-30">·</span>
                        <span>
                            {mounted ? new Date(script.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" }) : ""}
                        </span>
                    </div>
                    {getActionRow()}
                </div>
            </div>

            {/* Desktop Card */}
            <div className="hidden md:flex flex-col bg-card/60 backdrop-blur-md p-5 rounded-xl border border-accent/20 hover:border-accent/50 hover:bg-accent/5 transition-colors duration-150 group shadow-[var(--card-shadow)]">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-accent tracking-wider group-hover:text-accent transition-colors wrap-break-word">
                        {script.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-[10px] text-text-secondary tracking-widest font-bold mb-1">
                        <span>V.{script.version}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>INIT: {mounted ? new Date(script.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                </div>

                <div className="w-full h-px bg-accent/20 mt-3 group-hover:bg-accent/20 transition-colors" />

                {getActionRow()}
            </div>
        </>
    );
});

ScriptCard.displayName = "ScriptCard";
