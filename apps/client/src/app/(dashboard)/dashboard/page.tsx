"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";
import { CustomSelect } from "./components/CustomSelect";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { ScriptSkeleton } from "./components/ScriptSkeleton";
import { ScriptCard, RobotScript } from "./components/ScriptCard";
import { ProtocolForm } from "./components/ProtocolForm";
import { Plus, ChevronDown, Edit2, Play, Swords, Terminal, Box, Users } from "lucide-react";

const DashboardPage = () => {
    const [scripts, setScripts] = useState<RobotScript[]>([]);
    const [initialLoad, setInitialLoad] = useState(true);
    const [newScriptTitle, setNewScriptTitle] = useState("");
    const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({ message: "", type: null });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState<"COMBAT" | "RACING" | "TRAINING_SOLO">("COMBAT");
    const router = useRouter();

    useEffect(() => {
        const fetchScripts = async () => {
            try {
                const response = await apiClient.get("/scripts");
                setScripts(response.data);
            } catch (error: any) {
                console.error("Failed to fetch scripts:", error.response?.data?.message || error.message);
                if (error.response?.status === 401) {
                    router.push("/login");
                }
            } finally {
                setInitialLoad(false);
            }
        };
        fetchScripts();
    }, [router]);

    const handleCreateScript = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newScriptTitle.trim()) return;

        setIsLoading(true);
        setStatus({ message: "COMPILING NEURAL CORE...", type: null });

        try {
            const response = await apiClient.post("/scripts", { title: newScriptTitle, content: "// Write your AliScript here" });
            setScripts([...scripts, response.data]);
            setNewScriptTitle("");
            setStatus({ message: "[SYS] NEW SCRIPT PROTOCOL INITIALIZED.", type: "success" });
            setTimeout(() => setStatus({ message: "", type: null }), 3000);
        } catch (error: any) {
            console.error("Failed to create script:", error.response?.data?.message || error.message);
            setStatus({
                message: `[ERR] COMPILATION FAILED: ${error.response?.data?.message || error.message}`,
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToArena = (scriptId: string) => {
        router.push(`/arena?scriptId=${scriptId}&mode=${selectedMode}`);
    };

    const handleGoToLobby = (scriptId: string) => {
        localStorage.setItem("selectedScriptId", scriptId);
        router.push("/lobby");
    };

    const isMobile = useMediaQuery("(max-width: 768px)");

    const DesktopLayout = (
        <div className="max-w-5xl mx-auto pt-16 px-6 relative z-20">
            <div className="mb-12 border-b border-accent/20 pb-6 flex flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-accent font-black text-4xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] mb-2">
                        COMMAND CENTER
                    </h1>
                    <h2 className="text-accent/60 text-xs tracking-widest uppercase flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_var(--color-emerald-500)] shrink-0"></span>
                        Uplink Established | Operator Dashboard
                    </h2>
                </div>
            </div>

            {status.message && (
                <div className={`mb-8 p-3 rounded border text-xs break-words ${status.type === 'error' ? 'bg-red-950/40 border-red-900/50 text-red-400' :
                    status.type === 'success' ? 'bg-green-950/40 border-green-900/50 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]' :
                        'bg-accent/10 border-accent/20 text-accent animate-[pulse_1.5s_ease-in-out_infinite]'
                    }`}>
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-3 gap-8 flex-row">
                <div className="col-span-2 flex flex-col gap-4">
                    <div className="flex flex-row justify-between items-center mb-2 w-full">
                        <h3 className="text-accent/80 uppercase tracking-widest text-xs font-bold auto">Neural Scripts Repository</h3>
                        <div className="flex w-auto items-center justify-end gap-4">
                            <div className="w-auto">
                                <CustomSelect
                                    value={selectedMode}
                                    onChange={(val) => setSelectedMode(val as any)}
                                    isMobile={isMobile}
                                />
                            </div>
                            <span className="shrink-0 text-text-secondary text-[10px]">TOTAL: {scripts.length}</span>
                        </div>
                    </div>

                    {initialLoad ? (
                        <ScriptSkeleton isMobile={isMobile} />
                    ) : scripts.length === 0 ? (
                        <div className="bg-bg-secondary/40 border border-accent/10 border-dashed rounded-lg p-10 text-center text-text-secondary text-sm tracking-wider">
                            NO PROTOCOLS FOUND. INITIALIZE A NEW SCRIPT TO BEGIN.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {scripts.map((script) => (
                                <ScriptCard
                                    key={script.id}
                                    script={script}
                                    onEditBrain={(id) => console.log("Edit script:", id)}
                                    onDeployToLobby={handleGoToLobby}
                                    onDeployToArena={handleGoToArena}
                                    isMobile={isMobile}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-span-1 flex flex-col gap-8">
                    <ProtocolForm
                        newScriptTitle={newScriptTitle}
                        setNewScriptTitle={setNewScriptTitle}
                        isLoading={isLoading}
                        onSubmit={handleCreateScript}
                        isMobile={isMobile}
                    />
                </div>
            </div>
        </div>
    );

    const MobileLayout = (
        <div className="w-full px-4 pt-4 pb-[env(safe-area-inset-bottom)] relative z-20 flex flex-col gap-6">
            {/* Mobile Header */}
            <header className="flex flex-col gap-1">
                <h1 className="text-accent font-black text-2xl tracking-[0.1em] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">
                    COMMAND CENTER
                </h1>
                <p className="text-[10px] text-text-secondary tracking-[0.2em] font-medium uppercase opacity-70">
                    Your neural scripts
                </p>
            </header>

            {/* Initialize Protocol (Overhauled Component) */}
            <ProtocolForm
                newScriptTitle={newScriptTitle}
                setNewScriptTitle={setNewScriptTitle}
                isLoading={isLoading}
                onSubmit={handleCreateScript}
                isMobile={true}
            />

            {/* Filter & Stats Row */}
            <div className="flex items-center gap-3 w-full">
                <div className="flex-1">
                    <CustomSelect
                        value={selectedMode}
                        onChange={(val) => setSelectedMode(val as any)}
                        isMobile={true}
                    />
                </div>
                <div className="bg-accent/10 border border-accent/20 rounded-full px-4 py-2 flex items-center gap-2 shrink-0 h-[44px]">
                    <Terminal size={10} className="text-accent" />
                    <span className="text-[10px] font-bold text-accent tracking-tighter">TOTAL: {scripts.length}</span>
                </div>
            </div>

            {/* Status Feedback (Mobile Optimized) */}
            {status.message && (
                <div className={`p-4 rounded-xl border text-[10px] font-bold tracking-wider shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
                    status.type === 'error' ? 'bg-red-950/20 border-red-900/40 text-red-400' :
                    status.type === 'success' ? 'bg-green-950/20 border-green-900/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
                    'bg-accent/10 border-accent/20 text-accent'
                }`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full animate-pulse ${
                            status.type === 'error' ? 'bg-red-500' : status.type === 'success' ? 'bg-green-500' : 'bg-accent'
                        }`} />
                        {status.message}
                    </div>
                </div>
            )}

            {/* Script List */}
            <div className="flex flex-col gap-4">
                {initialLoad ? (
                    <ScriptSkeleton isMobile={true} />
                ) : scripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-bg-secondary/20 border-2 border-dashed border-accent/10 rounded-2xl text-center gap-4">
                        <div className="relative">
                            <Box size={48} className="text-accent/20" />
                            <Terminal size={20} className="text-accent/40 absolute -bottom-1 -right-1" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-accent font-bold tracking-widest text-xs uppercase">NO SCRIPTS DETECTED</h3>
                            <p className="text-[10px] text-text-secondary">Initialize your first protocol above</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {scripts.map((script) => (
                            <ScriptCard
                                key={script.id}
                                script={script}
                                onEditBrain={(id) => console.log("Edit script:", id)}
                                onDeployToLobby={handleGoToLobby}
                                onDeployToArena={handleGoToArena}
                                isMobile={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}>
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed"
                style={{ backgroundImage: 'linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            {isMobile ? MobileLayout : DesktopLayout}
        </div>
    );
};

export default DashboardPage;