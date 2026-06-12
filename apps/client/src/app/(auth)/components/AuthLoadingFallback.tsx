export function AuthLoadingFallback({ label = "Loading..." }: { label?: string }) {
    return (
        <div className="min-h-dvh bg-bg-primary flex items-center justify-center relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--accent-rgb),0.06) 0%, transparent 70%)',
                }}
            />
            <div className="relative z-10 text-center flex flex-col items-center gap-4">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-accent/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                </div>
                <p className="text-text-secondary text-sm font-medium">{label}</p>
            </div>
        </div>
    );
}