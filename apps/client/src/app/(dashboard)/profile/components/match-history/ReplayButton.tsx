"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Props {
    matchId: string;
    isGuest?: boolean;
}

export function ReplayButton({ matchId, isGuest }: Props) {
    const router = useRouter();


    return (
        <button
            type="button"
            onClick={() => router.push(`/replay/${matchId}`)}
            className="px-3 py-1.5 rounded-[4px] text-[8px] font-bold tracking-[0.2em] bg-accent/[0.08] border border-accent/20 text-accent transition-all duration-300 hover:bg-accent/20 hover:border-accent/50 hover:shadow-[0_0_10px_rgba(var(--accent-rgb),0.4)] active:scale-95 cursor-pointer"
        >
            VIEW
        </button>
    );
}
