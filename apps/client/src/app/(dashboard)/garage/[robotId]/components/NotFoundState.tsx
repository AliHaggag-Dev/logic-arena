"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface NotFoundStateProps {
    robotId: string;
}

export function NotFoundState({ robotId }: NotFoundStateProps) {
    const router = useRouter();

    return (
        <div
            className="min-h-screen bg-bg-primary font-mono text-accent/90 flex items-center justify-center"
            style={{ animation: "garageFadeIn 0.35s ease" }}
        >
            <div className="text-center border border-accent/10 rounded-xl p-10 bg-card/40 backdrop-blur-md max-w-sm">
                <p className="text-[9px] tracking-[0.28em] text-accent/30 mb-3 uppercase font-bold">
                    // SYSTEM ERROR
                </p>
                <p className="text-red-400/80 text-[13px] tracking-[0.2em] mb-6 uppercase font-bold">
                    [ERR] ROBOT NOT FOUND
                </p>
                <p className="text-[10px] tracking-[0.1em] text-accent/30 mb-6 font-mono">
                    UNIT ID: {robotId || "UNKNOWN"}
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/garage")}
                    className="text-[10px] tracking-[0.2em] text-accent/50 hover:text-accent transition-colors uppercase font-bold border border-accent/10 hover:border-accent/30 px-4 py-2 rounded-lg"
                >
                    ← BACK TO GARAGE
                </button>
            </div>
        </div>
    );
}
