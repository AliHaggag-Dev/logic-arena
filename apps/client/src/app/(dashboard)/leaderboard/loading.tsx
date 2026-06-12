const ROW_COUNT = 8;

export default function LeaderboardLoading() {
  return (
    <div className="min-h-dvh bg-bg-primary font-mono text-accent relative overflow-hidden pb-12">
      {/* Background grid */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-5xl mx-auto pt-16 px-6 relative z-20">
        {/* Header */}
        <div className="mb-8 border-b border-accent/20 pb-6">
          <div className="h-10 w-64 rounded bg-accent/10 animate-pulse" />
          <div className="mt-2 h-3 w-44 rounded bg-accent/5 animate-pulse" />
        </div>

        {/* Table header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-accent/10 mb-2">
          <div className="h-3 w-8 rounded bg-accent/8 animate-pulse" />
          <div className="h-3 w-32 rounded bg-accent/8 animate-pulse" />
          <div className="ml-auto h-3 w-16 rounded bg-accent/8 animate-pulse" />
          <div className="h-3 w-20 rounded bg-accent/8 animate-pulse" />
        </div>

        {/* Table rows */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-4 rounded-xl border border-accent/10 bg-card/30"
            >
              {/* Rank */}
              <div className="h-5 w-6 rounded bg-accent/10 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-accent/10 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              {/* Username */}
              <div
                className="h-4 rounded bg-accent/8 animate-pulse"
                style={{
                  width: `${100 + (i % 3) * 40}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
              {/* Stats */}
              <div className="ml-auto flex gap-3">
                <div className="h-4 w-12 rounded bg-accent/5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="h-4 w-16 rounded bg-accent/5 animate-pulse" style={{ animationDelay: `${i * 80 + 40}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
