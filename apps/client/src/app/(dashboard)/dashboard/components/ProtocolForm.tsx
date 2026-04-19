import React from "react";

interface ProtocolFormProps {
    newScriptTitle: string;
    setNewScriptTitle: (val: string) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export const ProtocolForm = ({ newScriptTitle, setNewScriptTitle, isLoading, onSubmit }: ProtocolFormProps) => {
    return (
        <div className="bg-card/60 backdrop-blur-xl border border-accent/10 rounded-xl p-5 sm:p-6 lg:sticky lg:top-8 relative" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

            <h3 className="text-accent uppercase tracking-widest text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 flex items-center gap-2">
                [+] Initialize Protocol
            </h3>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-[0.2em] font-bold ml-1">
                        Protocol Designation
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. AGGRESSIVE_SWARM"
                        className="w-full bg-bg-secondary/50 border border-accent/10 rounded-lg p-3 text-accent outline-none focus:border-accent focus:bg-accent/5 transition-all shadow-inner text-[10px] sm:text-xs placeholder-text-secondary/40"
                        value={newScriptTitle}
                        onChange={(e) => setNewScriptTitle(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !newScriptTitle.trim()}
                    className="w-full py-3 mt-1 sm:mt-2 bg-accent/10 border border-accent/40 text-accent font-bold text-[10px] sm:text-xs hover:bg-accent/20 hover:border-accent hover:text-text-primary transition-all rounded-lg uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(var(--accent-rgb),0)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "COMPILING..." : "GENERATE SCRIPT"}
                </button>
            </form>
        </div>
    );
};
