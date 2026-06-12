export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-bg-primary font-mono text-accent relative overflow-hidden pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Background grid */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none bg-[linear-gradient(rgba(var(--accent-rgb),0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--accent-rgb),0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="w-full px-4 pt-4 lg:px-8 lg:pt-8 lg:pb-8 relative z-20 flex flex-col gap-4">
        {/* Header skeleton */}
        <header className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-end border-b border-accent/10 pb-4">
          <div>
            <div className="h-8 w-52 rounded bg-accent/10 animate-pulse" />
            <div className="mt-2 h-3 w-36 rounded bg-accent/5 animate-pulse" />
          </div>
        </header>

        {/* Grid skeleton */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start flex-1 w-full">
          {/* Left column — ArenaSelector placeholder */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            <div className="rounded-[24px] border border-accent/15 bg-card/45 p-6 flex flex-col gap-5">
              <div className="h-5 w-40 rounded bg-accent/10 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-accent/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
              <div className="h-12 rounded-xl bg-accent/8 animate-pulse" />
            </div>
          </div>

          {/* Right column — Script list placeholder */}
          <div className="lg:col-span-5 flex flex-col bg-card/45 border border-accent/15 rounded-[24px] p-5 md:p-6 w-full lg:sticky lg:top-8 lg:h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-36 rounded bg-accent/10 animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-accent/10 animate-pulse" />
            </div>
            <div className="h-10 rounded-xl bg-accent/8 animate-pulse mb-4" />
            <div className="flex-1 flex flex-col gap-3 pt-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-accent/5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
