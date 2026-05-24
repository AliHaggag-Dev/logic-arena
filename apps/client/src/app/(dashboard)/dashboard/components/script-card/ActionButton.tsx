import React from "react";

interface ActionButtonProps {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    disabled?: boolean;
    colorClass: string;
    glowColor: string;
    borderColor: string;
}

export const ActionButton = ({ icon, tooltip, onClick, disabled, colorClass, glowColor, borderColor }: ActionButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`group/btn relative flex items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-lg transition-all duration-300 outline-none ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : `cursor-pointer ${colorClass}`}`}
    >
        <div className="relative z-10 transition-transform duration-300 group-hover/btn:scale-110 group-active/btn:scale-90">
            {icon}
        </div>

        {!disabled && (
            <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-md pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
            />
        )}

        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-bg-secondary/95 backdrop-blur-xl border ${borderColor} text-text-primary text-[9px] font-bold tracking-widest rounded-lg opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-2xl translate-y-1 group-hover/btn:translate-y-0 hidden md:block`}>
            {tooltip}
            <span className={`absolute -bottom-[3.5px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-bg-secondary/95 border-b border-r ${borderColor} rotate-45`}></span>
        </span>
    </button>
);
