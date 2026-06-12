const STAT_CARD_COUNT = 4;
const MATCH_ROW_COUNT = 4;

export default function ProfileLoading() {
  return (
    <div
      className="min-h-dvh font-mono relative overflow-hidden"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[960px] px-4 pt-6 md:px-8 md:pt-12 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-32">
        {/* Back button */}
        <div className="mb-6">
          <div className="h-7 w-20 rounded bg-accent/10 animate-pulse" />
        </div>

        {/* Hero section */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-accent/10">
          {/* Avatar */}
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-accent/10 animate-pulse shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-7 w-44 rounded bg-accent/10 animate-pulse" />
            <div className="h-3 w-28 rounded bg-accent/5 animate-pulse" style={{ animationDelay: "100ms" }} />
            <div className="h-3 w-56 rounded bg-accent/5 animate-pulse" style={{ animationDelay: "200ms" }} />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: STAT_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-accent/10 bg-card/30 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Achievements row */}
        <div className="mb-8">
          <div className="h-5 w-36 rounded bg-accent/10 animate-pulse mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 w-14 rounded-lg bg-accent/5 animate-pulse shrink-0"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Analytics section */}
        <div className="mb-8">
          <div className="h-5 w-28 rounded bg-accent/10 animate-pulse mb-4" />
          <div className="h-48 rounded-xl border border-accent/10 bg-card/20 animate-pulse" />
        </div>

        {/* Match history */}
        <div>
          <div className="h-5 w-36 rounded bg-accent/10 animate-pulse mb-4" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: MATCH_ROW_COUNT }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-accent/10 bg-card/30 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
