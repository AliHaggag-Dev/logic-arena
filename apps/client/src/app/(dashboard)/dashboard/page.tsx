"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useScripts } from "./hooks/useScripts";
import { ArenaSelector } from "./components/ArenaSelector";
import { ScriptSkeleton } from "./components/ScriptSkeleton";
import { ScriptCard } from "./components/script-card/ScriptCard";
import { ScriptForm } from "./components/ScriptForm";
import dynamic from "next/dynamic";
import { Terminal, Box, Swords } from "lucide-react";
import { AuthModal } from "../../../components/AuthModal";

const EditScriptModal = dynamic(
    () => import("./components/EditScriptModal").then((mod) => mod.EditScriptModal),
    { ssr: false }
);

export default function DashboardPage() {
    const {
        scripts, initialLoad, newScriptTitle, setNewScriptTitle,
        newScriptMode, setNewScriptMode,
        status, isLoading, selectedMode, setSelectedMode,
        selectedTheme, setSelectedTheme,
        editingScript, setEditingScript, isGuest, showAuthModal, setShowAuthModal,
        handleCreateScript, handleGoToArena, handleGoToLobby, handleEditScript,
        handleOptimisticUpdate, handleChangeScriptMode, handleRevert, handleDeleteScript
    } = useScripts();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return (
        <div className="min-h-dvh bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0">
            {/* Background cyber grid effect */}
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none bg-[linear-gradient(rgba(var(--accent-rgb),0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--accent-rgb),0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            {/* Layout container */}
            <div className="w-full px-4 pt-4 lg:px-8 lg:pt-8 lg:pb-8 relative z-20 flex flex-col gap-4 min-h-[calc(100vh-120px)]">
                
                {/* Header Section */}
                <header className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-end border-b border-accent/10 pb-4">
                    <div>
                        <h1 className="text-accent font-black text-2xl lg:text-3xl tracking-[0.18em] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.35)] mb-1">
                            DASHBOARD
                        </h1>
                        <p className="sm:hidden text-[9px] text-text-secondary tracking-[0.18em] font-black uppercase opacity-70">
                            Your logic scripts
                        </p>
                        <h2 className="hidden sm:flex text-accent/60 text-[10px] tracking-widest uppercase items-center gap-2 font-black">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_var(--color-emerald-500)] shrink-0" />
                            CONNECTED | SYSTEM ONLINE
                        </h2>
                    </div>
                </header>

                {/* Status Message */}
                {status.message && (
                    <div className={`p-3 px-4 rounded-2xl border text-xs font-black tracking-wider animate-in fade-in slide-in-from-top-2 duration-300 w-full shrink-0 ${
                        status.type === 'error' 
                        ? 'bg-red-950/20 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                        : status.type === 'success' 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                        : 'bg-accent/15 border-accent/20 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                status.type === 'error' ? 'bg-red-400' : status.type === 'success' ? 'bg-emerald-400' : 'bg-accent'
                            }`} />
                            {status.message}
                        </div>
                    </div>
                )}

                {/* Mobile Quick Lobby Link */}
                <Link
                    href="/lobby"
                    className="group relative flex min-h-16 overflow-hidden rounded-2xl border border-accent/25 bg-card/45 backdrop-blur-xl p-4 text-left shadow-[0_12px_28px_rgba(var(--accent-rgb),0.06)] transition-all hover:border-accent/50 md:hidden shrink-0"
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70" />
                    <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                            <Swords className="h-6 w-6" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-black uppercase tracking-[0.18em] text-text-primary">Lobby</span>
                            <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.15em] text-text-secondary">Deploy scripts into live matches</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop and Tablet Layout Grid */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start flex-1 min-h-0 w-full">
                    
                    {/* Left Column (7 cols): Campaign Nexus */}
                    <div className="lg:col-span-7 flex flex-col gap-6 min-h-0 w-full">
                        {/* Arena Selector Component */}
                        <ArenaSelector
                            selectedMode={selectedMode}
                            setSelectedMode={setSelectedMode}
                            selectedTheme={selectedTheme}
                            setSelectedTheme={setSelectedTheme}
                        />
                    </div>

                    {/* Right Column (5 cols): Scripts List & Creation */}
                    <div className="lg:col-span-5 flex flex-col bg-card/45 backdrop-blur-xl border border-accent/15 rounded-[24px] p-5 md:p-6 shadow-[var(--card-shadow)] w-full lg:sticky lg:top-8 lg:h-[calc(100vh-140px)]">
                        
                        {/* List Header */}
                        <div className="flex items-center justify-between gap-3 w-full mb-4 shrink-0">
                            <h3 className="text-accent font-black uppercase tracking-[0.18em] text-xs flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-accent rounded-sm animate-pulse" />
                                YOUR SCRIPTS
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full shrink-0">
                                <Terminal size={10} className="text-accent" />
                                <span className="text-[9px] font-black text-accent tracking-wider">TOTAL: {scripts.length}</span>
                            </div>
                        </div>

                        {/* Create Script Component - Sits above the list */}
                        <div className="mb-4 shrink-0">
                            <ScriptForm
                                newScriptTitle={newScriptTitle}
                                setNewScriptTitle={setNewScriptTitle}
                                newScriptMode={newScriptMode}
                                setNewScriptMode={setNewScriptMode}
                                isLoading={isLoading}
                                onSubmit={handleCreateScript}
                                isGuest={isGuest}
                            />
                        </div>

                        {/* Scrolling scripts list */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-3 px-3 pb-6 flex flex-col gap-3 no-scrollbar">
                            {initialLoad ? (
                                <ScriptSkeleton isMobile={isMobile} />
                            ) : scripts.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-secondary/10 border border-dashed border-accent/15 rounded-2xl text-center gap-3 text-text-secondary">
                                    <div className="relative">
                                        <Box size={40} className="text-accent/20" />
                                        <Terminal size={16} className="text-accent/70 absolute -bottom-1 -right-1" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-accent font-black tracking-widest text-xs uppercase">NO SCRIPTS DETECTED</h3>
                                        <p className="text-[9px] text-text-secondary/70">Create your first script to get started</p>
                                    </div>
                                </div>
                            ) : (
                                scripts.map((script) => (
                                    <ScriptCard
                                        key={script.id}
                                        script={script}
                                        onEditBrain={handleEditScript}
                                        onChangeMode={handleChangeScriptMode}
                                        onDeployToLobby={handleGoToLobby}
                                        onDeployToArena={handleGoToArena}
                                        onDelete={handleDeleteScript}
                                        isGuest={isGuest}
                                    />
                                ))
                            )}
                        </div>
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
