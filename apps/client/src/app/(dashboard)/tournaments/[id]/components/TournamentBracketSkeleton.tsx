import React from "react";

export function TournamentBracketSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-accent/10 pb-7 mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="h-2.5 w-36 bg-accent/10 rounded mb-3" />
          <div className="h-9 w-64 bg-accent/20 rounded mb-3" />
          <div className="flex gap-3 items-center">
            <div className="h-5 w-14 bg-accent/10 rounded" />
            <div className="h-3 w-40 bg-accent/10 rounded" />
          </div>
        </div>
        <div className="h-10 w-48 bg-accent/10 rounded-lg" />
      </div>

      {/* Main content skeleton */}
      <div className="flex gap-6">
        {/* Bracket area */}
        <div className="flex-1 min-w-0 rounded-2xl bg-card/10 border border-accent/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex gap-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-3 w-28 bg-accent/10 rounded" />
            ))}
          </div>
          <div className="flex gap-8 items-center justify-center py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-6">
                {[1, 2].map((j) => (
                  <div key={j} className="w-[200px] h-[54px] bg-accent/10 border border-accent/10 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-card/10 border border-accent/10 backdrop-blur-md">
            <div className="flex justify-between mb-4">
              <div className="h-2 w-16 bg-accent/10 rounded" />
              <div className="h-2 w-8 bg-accent/10 rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-accent/5 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-accent/20 shrink-0" />
                <div className="h-2 w-24 bg-accent/10 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
