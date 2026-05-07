export function AuthLoadingFallback({ label = "LOADING..." }: { label?: string }) {
    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center font-mono relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />
            <div className="relative z-10 text-center">
                <div className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                <p className="text-accent/70 text-[11px] tracking-[0.35em] font-black uppercase animate-pulse">
                    {label}
                </p>
            </div>
        </div>
    );
}