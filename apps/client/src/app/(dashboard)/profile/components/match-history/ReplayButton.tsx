"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Props {
    matchId: string;
    isGuest?: boolean;
}

export function ReplayButton({ matchId, isGuest }: Props) {
    const router = useRouter();

    if (isGuest) {
        return (
            <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-[4px] text-[8px] font-bold tracking-[0.2em] opacity-40 cursor-not-allowed"
                style={{
                    background: "rgba(var(--accent-rgb),0.05)",
                    border: "1px solid rgba(var(--accent-rgb),0.1)",
                    color: "var(--accent)",
                }}
            >
                LOCKED
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => router.push(`/replay/${matchId}`)}
            className="px-3 py-1.5 rounded-[4px] text-[8px] font-bold tracking-[0.2em]
                transition-all hover:bg-accent/10 active:scale-95 cursor-pointer"
            style={{
                background: "rgba(var(--accent-rgb),0.08)",
                border: "1px solid rgba(var(--accent-rgb),0.2)",
                color: "var(--accent)",
            }}
        >
            VIEW
        </button>
    );
}
