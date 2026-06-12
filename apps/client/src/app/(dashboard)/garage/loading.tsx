export default function GarageLoading() {
  return (
    <div className="min-h-dvh bg-bg-primary font-mono text-accent relative overflow-hidden pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Background grid */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none bg-[linear-gradient(rgba(var(--accent-rgb),0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--accent-rgb),0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="w-full px-4 pt-4 lg:px-8 lg:pt-8 relative z-20 flex flex-col gap-6">
        {/* Header */}
        <div className="border-b border-accent/10 pb-4">
          <div className="h-8 w-36 rounded bg-accent/10 animate-pulse" />
          <div className="mt-2 h-3 w-48 rounded bg-accent/5 animate-pulse" />
        </div>

        {/* Content grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
          {/* 3D viewer placeholder */}
          <div className="aspect-square lg:aspect-[4/3] rounded-[24px] border border-accent/15 bg-card/45 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-accent/5 animate-pulse" />
          </div>

          {/* Category tabs + item grid */}
          <div className="flex flex-col gap-4">
            {/* Tab bar */}
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 flex-1 rounded-lg bg-accent/8 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            {/* Item cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl border border-accent/10 bg-accent/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
