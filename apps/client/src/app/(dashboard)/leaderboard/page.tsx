"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";
import { LeaderboardTable, LeaderboardUser } from "./components/LeaderboardTable";
import { useSocket } from "../../../context/SocketContext";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

const LeaderboardPage = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [isGuest, setIsGuest] = useState(false);
    const { sendChallenge } = useSocket();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsGuest(!token);
        setCurrentUserId(localStorage.getItem('userId') ?? '');

        const fetchLeaderboard = async () => {
            try {
                const response = await apiClient.get("/users/leaderboard");
                setUsers(response.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();

        const interval = setInterval(() => {
            fetchLeaderboard();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const isMobile = useMediaQuery("(max-width: 768px)");

    const DesktopLayout = (
        <div className="max-w-4xl mx-auto pt-16 px-6 relative z-20">
            {/* Header */}
            <div className="mb-8 border-b border-accent/20 pb-6">
                <h1 className="text-accent font-black text-4xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
                    LEADERBOARD
                </h1>
                <p className="text-accent/60 text-xs tracking-widest uppercase mt-2">
                    Global Player Rankings
                </p>
            </div>

            {/* Table */}
            <LeaderboardTable
                users={users}
                isLoading={isLoading}
                currentUserId={currentUserId}
                onChallenge={sendChallenge}
                isGuest={isGuest}
            />

            {/* Footer Decor */}
            <div className="mt-8 flex justify-center opacity-30">
                <div className="flex gap-4 items-center">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent"></div>
                    <div className="w-2 h-2 border border-accent rotate-45 animate-pulse"></div>
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent"></div>
                </div>
            </div>
        </div>
    );

    const MobileLayout = (
        <div className="w-full px-4 pt-4 pb-[env(safe-area-inset-bottom)] relative z-20">
            {/* Header */}
            <div className="mb-6 border-b border-accent/20 pb-4">
                <h1 className="text-accent font-black text-xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
                    LEADERBOARD
                </h1>
                <p className="text-accent/60 text-[10px] tracking-widest uppercase mt-2">
                    Global Player Rankings
                </p>
            </div>

            <LeaderboardTable
                users={users}
                isLoading={isLoading}
                currentUserId={currentUserId}
                onChallenge={sendChallenge}
                isGuest={isGuest}
            />
        </div>
    );

    return (
        <div className={`min-h-screen bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}>
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed"
                style={{ backgroundImage: 'linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            {isMobile ? MobileLayout : DesktopLayout}
        </div>
    );
};

export default LeaderboardPage;
