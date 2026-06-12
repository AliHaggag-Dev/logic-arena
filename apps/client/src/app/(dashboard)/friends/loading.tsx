const FRIEND_ROW_COUNT = 5;
const TAB_COUNT = 3;

export default function FriendsLoading() {
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

      <div className="max-w-5xl mx-auto pt-12 px-6 relative z-20">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-accent/20">
          <div className="h-10 w-72 rounded bg-accent/10 animate-pulse" />
          <div className="mt-2 h-3 w-52 rounded bg-accent/5 animate-pulse" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: TAB_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-9 flex-1 max-w-[140px] rounded-lg bg-accent/8 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Friend rows */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: FRIEND_ROW_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-accent/10 bg-card/30"
            >
              {/* Avatar */}
              <div
                className="h-10 w-10 rounded-full bg-accent/10 animate-pulse shrink-0"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              {/* Name + status */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div
                  className="h-4 rounded bg-accent/10 animate-pulse"
                  style={{
                    width: `${90 + (i % 3) * 30}px`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
                <div
                  className="h-2.5 w-16 rounded bg-accent/5 animate-pulse"
                  style={{ animationDelay: `${i * 80 + 40}ms` }}
                />
              </div>
              {/* Action button placeholder */}
              <div
                className="h-8 w-20 rounded-lg bg-accent/5 animate-pulse shrink-0"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
