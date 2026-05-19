"use client";

import React from "react";

interface SaveButtonProps {
    onClick: () => void;
    disabled: boolean;
    label: string;
    isGuest: boolean;
    variant: "desktop" | "mobile";
}

export function SaveButton({ onClick, disabled, label, isGuest, variant }: SaveButtonProps) {
    const isDesktop = variant === "desktop";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={
                isDesktop
                    ? [
                        "w-full py-4 rounded-xl border tracking-[0.22em] text-[12px] font-black",
                        "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                        "group relative overflow-hidden active:scale-[0.98]",
                        isGuest
                            ? "bg-accent/5 border-accent/10 text-accent/30"
                            : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20",
                    ].join(" ")
                    : [
                        "w-full py-4 rounded-xl border tracking-[0.3em] text-[11px] font-black",
                        "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                        "shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] active:scale-[0.96]",
                        isGuest
                            ? "bg-accent/5 border-accent/10 text-accent/30"
                            : "bg-accent/20 border-accent/40 text-accent",
                    ].join(" ")
            }
        >
            {isDesktop && !isGuest && (
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            {label}
        </button>
    );
}
