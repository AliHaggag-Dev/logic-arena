"use client";

import React from "react";
import Link from "next/link";
import { useScripts } from "./hooks/useScripts";
import { CustomSelect } from "./components/CustomSelect";
import { ScriptSkeleton } from "./components/ScriptSkeleton";
import { ScriptCard } from "./components/script-card/ScriptCard";
import { ProtocolForm } from "./components/ProtocolForm";
import dynamic from "next/dynamic";
import { Terminal, Box, Swords } from "lucide-react";
import { AuthModal } from "../../../components/AuthModal";
import type { GameMode } from "./hooks/useScripts";

const EditScriptModal = dynamic(
    () => import("./components/EditScriptModal").then((mod) => mod.EditScriptModal),
    { ssr: false }
);

export default function DashboardPage() {
    const {
        scripts, initialLoad, newScriptTitle, setNewScriptTitle,
        status, isLoading, selectedMode, setSelectedMode,
        editingScript, setEditingScript, isGuest, showAuthModal, setShowAuthModal,
        handleCreateScript, handleGoToArena, handleGoToLobby, handleEditScript,
        handleOptimisticUpdate, handleRevert, handleDeleteScript
    } = useScripts();

    return (
        <div className="min-h-screen bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-12">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(rgba(var(--accent-rgb),0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--accent-rgb),0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            <div className="w-full px-4 pt-4 md:max-w-5xl md:mx-auto md:pt-16 md:px-6 relative z-20 flex flex-col gap-6 md:gap-12">
                
                {/* Header */}
                <header className="flex flex-col gap-1 md:flex-row md:justify-between md:items-end md:border-b md:border-accent/20 md:pb-6">
                    <div>
                        <h1 className="text-accent font-black text-2xl md:text-4xl tracking-widest md:tracking-[0.15em] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)] md:drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] mb-0 md:mb-2">
                            DASHBOARD
                        </h1>
                        <p className="md:hidden text-[10px] text-text-secondary tracking-[0.2em] font-medium uppercase opacity-70">
                            Your neural scripts
                        </p>
                        <h2 className="hidden md:flex text-accent/60 text-xs tracking-widest uppercase items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_var(--color-emerald-500)] shrink-0"></span>
                            Connected | User Dashboard
                        </h2>
                    </div>
                </header>

                {/* Status Message */}
                {status.message && (
                    <div className={`p-4 md:p-3 rounded-xl md:rounded border text-[10px] md:text-xs font-bold md:font-normal tracking-wider md:tracking-normal shadow-sm md:shadow-none animate-in fade-in slide-in-from-top-2 md:slide-in-from-top-0 duration-200 wrap-break-word ${status.type === 'error' ? 'bg-red-950/20 md:bg-red-950/40 border-red-900/40 md:border-red-900/50 text-red-400' :
                        status.type === 'success' ? 'bg-green-950/20 md:bg-green-950/40 border-green-900/40 md:border-green-900/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)] md:drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]' :
                            'bg-accent/10 border-accent/20 text-accent md:animate-[pulse_1.5s_ease-in-out_infinite]'
                        }`}>
                        <div className="flex items-center gap-2">
                            <div className={`md:hidden w-1 h-1 rounded-full animate-pulse ${status.type === 'error' ? 'bg-red-500' : status.type === 'success' ? 'bg-green-500' : 'bg-accent'}`} />
                            {status.message}
                        </div>
                    </div>
                )}

                <Link
                    href="/lobby"
                    className="group relative block min-h-16 overflow-hidden rounded-2xl border border-accent/30 bg-card p-4 text-left shadow-[0_12px_28px_rgba(var(--accent-rgb),0.10)] transition-colors hover:border-accent md:hidden"
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70" />
                    <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                            <Swords className="h-6 w-6" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-base font-black uppercase tracking-[0.18em] text-text-primary">Lobby</span>
                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Deploy scripts into live matches</span>
                        </span>
                    </div>
                </Link>

                <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* Create Script Form */}
                    <div className="md:col-span-1 md:col-start-3 md:row-start-1">
                        <ProtocolForm
                            newScriptTitle={newScriptTitle}
                            setNewScriptTitle={setNewScriptTitle}
                            isLoading={isLoading}
                            onSubmit={handleCreateScript}
                            isGuest={isGuest}
                        />
                    </div>

                    <div className="md:col-span-2 md:col-start-1 md:row-start-1 flex flex-col gap-4">
                        {/* Filter & Stats Row */}
                        <div className="flex items-center justify-between gap-3 w-full mb-0 md:mb-2">
                            <h3 className="hidden md:block text-accent/80 uppercase tracking-widest text-xs font-bold w-auto">AVAILABLE SCRIPTS</h3>
                            <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
                                <div className="flex-1 md:flex-none md:w-auto">
                                    <CustomSelect
                                        value={selectedMode}
                                        onChange={(val) => setSelectedMode(val as GameMode)}
                                    />
                                </div>
                                <div className="md:hidden bg-accent/10 border border-accent/20 rounded-full px-4 py-2 flex items-center gap-2 shrink-0 h-11">
                                    <Terminal size={10} className="text-accent" />
                                    <span className="text-[10px] font-bold text-accent tracking-tighter">TOTAL: {scripts.length}</span>
                                </div>
                                <span className="hidden md:inline shrink-0 text-text-secondary text-[10px]">TOTAL: {scripts.length}</span>
                            </div>
                        </div>

                        {/* Script List */}
                        {initialLoad ? (
                            <ScriptSkeleton />
                        ) : scripts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-bg-secondary/20 md:bg-bg-secondary/40 border-2 md:border-dashed border-accent/10 md:rounded-lg rounded-2xl text-center gap-4 text-text-secondary">
                                <div className="relative md:hidden">
                                    <Box size={48} className="text-accent/20" />
                                    <Terminal size={20} className="text-accent/70 absolute -bottom-1 -right-1" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-accent font-bold tracking-widest text-xs uppercase md:text-sm md:font-normal md:tracking-wider">NO SCRIPTS DETECTED</h3>
                                    <p className="text-[10px] text-text-secondary md:hidden">Create your first script above</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 md:gap-3">
                                {scripts.map((script) => (
                                    <ScriptCard
                                        key={script.id}
                                        script={script}
                                        onEditBrain={handleEditScript}
                                        onDeployToLobby={handleGoToLobby}
                                        onDeployToArena={handleGoToArena}
                                        onDelete={handleDeleteScript}
                                        isGuest={isGuest}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Script Modal */}
            {editingScript && (
                <EditScriptModal
                    script={editingScript}
                    onClose={() => setEditingScript(null)}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onRevert={handleRevert}
                />
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                title="GUEST ACCESS DETECTED"
                message="You must create an account to save custom scripts. Register now to store your logic."
            />
        </div>
    );
}
