export default function ArenaLoading() {
  return (
    <div className="min-h-dvh bg-black flex flex-col items-center justify-center font-mono select-none">
      {/* Central loading indicator */}
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing ring */}
        <div className="relative w-20 h-20">
          <div
            className="absolute inset-0 rounded-full border-2 animate-pulse"
            style={{
              borderColor: "rgba(var(--accent-rgb), 0.4)",
              boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.15), inset 0 0 20px rgba(var(--accent-rgb), 0.05)",
            }}
          />
          <div
            className="absolute inset-3 rounded-full border animate-pulse"
            style={{
              borderColor: "rgba(var(--accent-rgb), 0.2)",
              animationDelay: "200ms",
            }}
          />
          <div
            className="absolute inset-6 rounded-full bg-accent/10 animate-pulse"
            style={{ animationDelay: "400ms" }}
          />
        </div>

        {/* Label */}
        <span
          className="text-xs tracking-[0.25em] uppercase font-black animate-pulse"
          style={{ color: "rgba(var(--accent-rgb), 0.6)" }}
        >
          Loading Arena…
        </span>
      </div>

      {/* Bottom HUD hint bars */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        <div className="h-1 w-12 rounded-full bg-accent/10 animate-pulse" />
        <div className="h-1 w-8 rounded-full bg-accent/10 animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="h-1 w-16 rounded-full bg-accent/10 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
