"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface LeaderboardUser {
    id: string;
    username: string;
    rank: number;
    _count: {
        wonMatches: number;
    };
}

const LeaderboardPage = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await axios.get("http://localhost:3001/users/leaderboard");
                setUsers(response.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankColor = (index: number) => {
        if (index === 0) return "#FFD700"; // Gold
        if (index === 1) return "#C0C0C0"; // Silver
        if (index === 2) return "#CD7F32"; // Bronze
        return "#22d3ee"; // Cyan
    };

    return (
        <div className="min-h-screen bg-gray-950 font-mono text-cyan-300 selection:bg-cyan-500/30 relative overflow-hidden pb-12">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed"
                style={{ backgroundImage: 'linear-gradient(rgba(8, 145, 178, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(8, 145, 178, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="max-w-4xl mx-auto pt-10 sm:pt-16 px-4 sm:px-6 relative z-20">
                {/* Header */}
                <div className="mb-8 border-b border-cyan-900/60 pb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-cyan-400 font-black text-3xl sm:text-4xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            NEURAL COMBAT RANKINGS
                        </h1>
                        <p className="text-cyan-600/80 text-[10px] sm:text-xs tracking-widest uppercase mt-2">
                            Global Hackers Leaderboard | Top Tier Operators
                        </p>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 bg-cyan-600/10 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-cyan-600/30 transition-all rounded">
                        Back to Command Center
                    </Link>
                </div>

                {/* Table Container */}
                <div className="bg-black/60 backdrop-blur-xl border border-cyan-900/60 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-cyan-900/60 bg-cyan-950/20">
                                    <th className="px-6 py-4 text-cyan-500 uppercase tracking-widest text-[10px] sm:text-xs font-bold">Rank</th>
                                    <th className="px-6 py-4 text-cyan-500 uppercase tracking-widest text-[10px] sm:text-xs font-bold">Operator</th>
                                    <th className="px-6 py-4 text-cyan-500 uppercase tracking-widest text-[10px] sm:text-xs font-bold">Rank Points</th>
                                    <th className="px-6 py-4 text-cyan-500 uppercase tracking-widest text-[10px] sm:text-xs font-bold text-right">Victories</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-cyan-700 animate-pulse tracking-widest uppercase text-xs">
                                            Synchronizing with Mainframe...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-cyan-700 tracking-widest uppercase text-xs">
                                            No combat data available in neural archives.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user.id} className="border-b border-cyan-900/30 hover:bg-cyan-950/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg" style={{ color: getRankColor(index) }}>
                                                        #{index + 1}
                                                    </span>
                                                    {index === 0 && <span className="text-xl">👑</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-cyan-100 font-bold tracking-wider group-hover:text-white transition-colors">
                                                    {user.username}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-cyan-400 font-bold">{user.rank}</span>
                                                    <div className="h-1 w-20 bg-cyan-900/30 rounded-full overflow-hidden hidden sm:block">
                                                        <div 
                                                            className="h-full bg-cyan-500 shadow-[0_0_8px_#22d3ee]" 
                                                            style={{ width: `${Math.min((user.rank / 1000) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">
                                                    {user._count.wonMatches}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="mt-8 flex justify-center opacity-30">
                    <div className="flex gap-4 items-center">
                        <div className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-500"></div>
                        <div className="w-2 h-2 border border-cyan-500 rotate-45"></div>
                        <div className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-500"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
