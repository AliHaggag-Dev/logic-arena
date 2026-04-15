"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";

interface RobotScript {
    id: string;
    title: string;
    content: string;
    version: number;
    createdAt: string;
}

const CustomSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = ["COMBAT", "RACING", "TRAINING_SOLO"];

    return (
        <div className="relative font-mono text-[10px] sm:text-xs tracking-widest z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-4 bg-black/80 backdrop-blur-xl border border-[#00f3ff] rounded px-3 py-1.5 text-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.4)] hover:shadow-[0_0_15px_rgba(0,243,255,0.8)] hover:bg-cyan-500/20 transition-all uppercase w-40"
            >
                <span className="truncate">{value}</span>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''} text-[8px]`}>▼</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-40 z-50 bg-black/90 backdrop-blur-xl border border-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.5)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`px-3 py-2 text-left uppercase transition-all duration-75 hover:bg-cyan-400/30 hover:text-white hover:tracking-[0.1em] ${value === opt ? 'bg-cyan-950 text-[#00f3ff]' : 'text-cyan-300'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const DashboardPage = () => {
    const [scripts, setScripts] = useState<RobotScript[]>([]);
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
            }
        };
        fetchScripts();
    }, [router]);

    const handleCreateScript = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <div className="min-h-screen bg-gray-950 font-mono text-cyan-300 selection:bg-cyan-500/30 relative overflow-hidden pb-12">

            {/* Background Starfield/Grid Illusion */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed"
                style={{ backgroundImage: 'linear-gradient(rgba(8, 145, 178, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(8, 145, 178, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="max-w-5xl mx-auto pt-10 sm:pt-16 px-4 sm:px-6 relative z-20">

                {/* Header Section (Responsive typography) */}
                <div className="mb-8 sm:mb-12 border-b border-cyan-900/60 pb-4 sm:pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-cyan-400 font-black text-3xl sm:text-4xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-2">
                            COMMAND CENTER
                        </h1>
                        <h2 className="text-cyan-600/80 text-[10px] sm:text-xs tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e] shrink-0"></span>
                            Uplink Established | Operator Dashboard
                        </h2>
                    </div>
                    <Link
                        href="/leaderboard"
                        className="px-4 py-2 bg-cyan-600/10 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-cyan-600/30 hover:border-cyan-400 hover:text-white transition-all rounded shadow-[0_0_10px_rgba(34,211,238,0)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] whitespace-nowrap"
                    >
                        LEADERBOARD
                    </Link>
                </div>

                {/* Status Terminal */}
                {status.message && (
                    <div className={`mb-6 sm:mb-8 p-3 rounded border text-[10px] sm:text-xs break-words ${status.type === 'error' ? 'bg-red-950/40 border-red-900/50 text-red-400' :
                        status.type === 'success' ? 'bg-green-950/40 border-green-900/50 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]' :
                            'bg-cyan-950/40 border-cyan-900/50 text-cyan-400 animate-pulse'
                        }`}>
                        {status.message}
                    </div>
                )}

                {/* THE GRID FIX: Using order-1 and order-2 for mobile, then swapping on lg screens */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 flex-col">

                    {/* Left Column: Script List (Becomes Bottom on Mobile) */}
                    <div className="order-2 lg:order-1 lg:col-span-2 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-cyan-500 uppercase tracking-widest text-[10px] sm:text-xs font-bold">Neural Scripts Repository</h3>
                            <div className="flex items-center gap-4">
                                <CustomSelect 
                                    value={selectedMode} 
                                    onChange={(val) => setSelectedMode(val as any)}
                                />
                                <span className="text-cyan-800 text-[10px]">TOTAL: {scripts.length}</span>
                            </div>
                        </div>

                        {scripts.length === 0 ? (
                            <div className="bg-black/40 border border-cyan-900/50 border-dashed rounded-lg p-8 sm:p-10 text-center text-cyan-800 text-[10px] sm:text-sm tracking-wider">
                                NO PROTOCOLS FOUND. INITIALIZE A NEW SCRIPT TO BEGIN.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {scripts.map((script) => (
                                    <div key={script.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/60 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-cyan-900/50 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition-all group shadow-[0_4px_15px_rgba(0,0,0,0.5)]">

                                        <div className="flex flex-col gap-1 w-full">
                                            <h3 className="text-base sm:text-lg font-bold text-cyan-300 tracking-wider group-hover:text-cyan-200 transition-colors break-words">
                                                {script.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-cyan-700 tracking-widest font-bold">
                                                <span>V.{script.version}</span>
                                                <span className="hidden sm:inline">|</span>
                                                <span>INIT: {new Date(script.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                                            <button
                                                onClick={() => console.log("Edit script:", script.id)}
                                                className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-purple-600/10 border border-purple-500/40 text-purple-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-purple-600/30 hover:border-purple-400 hover:text-white transition-all rounded shadow-[0_0_10px_rgba(168,85,247,0)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] whitespace-nowrap"
                                            >
                                                Edit Brain
                                            </button>
                                            <button
                                                onClick={() => handleGoToLobby(script.id)}
                                                className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-blue-600/10 border border-blue-500/40 text-blue-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-blue-600/30 hover:border-blue-400 hover:text-white transition-all rounded shadow-[0_0_10px_rgba(59,130,246,0)] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap"
                                            >
                                                Deploy to Lobby
                                            </button>
                                            <button
                                                onClick={() => handleGoToArena(script.id)}
                                                className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-cyan-600/10 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-cyan-600/30 hover:border-cyan-400 hover:text-white transition-all rounded shadow-[0_0_10px_rgba(34,211,238,0)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] whitespace-nowrap"
                                            >
                                                Deploy to Arena
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Creation Panel (Becomes Top on Mobile) */}
                    <div className="order-1 lg:order-2 lg:col-span-1">
                        <div className="bg-black/60 backdrop-blur-xl border border-cyan-900/60 rounded-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] lg:sticky lg:top-8">

                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>

                            <h3 className="text-green-400 uppercase tracking-widest text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 flex items-center gap-2">
                                [+] Initialize Protocol
                            </h3>

                            <form onSubmit={handleCreateScript} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] sm:text-[9px] text-cyan-600 uppercase tracking-[0.2em] font-bold ml-1">
                                        Protocol Designation
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AGGRESSIVE_SWARM"
                                        className="w-full bg-black/50 border border-cyan-900/50 rounded-lg p-3 text-cyan-300 outline-none focus:border-cyan-400 focus:bg-cyan-950/20 transition-all shadow-inner text-[10px] sm:text-xs placeholder-cyan-900/50"
                                        value={newScriptTitle}
                                        onChange={(e) => setNewScriptTitle(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !newScriptTitle.trim()}
                                    className="w-full py-3 mt-1 sm:mt-2 bg-green-600/10 border border-green-500/40 text-green-400 font-bold text-[10px] sm:text-xs hover:bg-green-600/30 hover:border-green-400 hover:text-white transition-all rounded-lg uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(34,197,94,0)] hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "COMPILING..." : "GENERATE SCRIPT"}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DashboardPage;