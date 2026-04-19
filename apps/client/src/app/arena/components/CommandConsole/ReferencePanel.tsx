import React, { useState } from "react";

const REFERENCE_ITEMS = ["health", "distance", "spotted", "rotation", "target_vx", "target_vy", "bullet_speed"];

export const ReferencePanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-cyan-900/40 bg-black/30 rounded overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-1.5 flex items-center justify-between uppercase tracking-[0.2em] text-cyan-600 text-[10px] hover:bg-cyan-950/50 transition-colors"
            >
                <span>Variables Ref</span>
                <span className="text-cyan-400">{isOpen ? "▼" : "▶"}</span>
            </button>
            {isOpen && (
                <div className="p-2 border-t border-cyan-900/40 flex flex-wrap gap-1.5">
                    {REFERENCE_ITEMS.map((item) => (
                        <span key={item} className="px-1.5 py-0.5 bg-cyan-950/40 border border-cyan-900/60 rounded text-cyan-500 text-[10px]">
                            {item}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};