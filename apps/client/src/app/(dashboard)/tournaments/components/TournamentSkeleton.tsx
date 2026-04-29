import React from "react";

export function TournamentSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-card/60 rounded-xl p-6 border border-accent/10 backdrop-blur-md flex flex-col gap-4 animate-pulse" style={{ boxShadow: 'var(--card-shadow)' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-accent/20 rounded mb-2" />
              <div className="h-2 w-1/2 bg-accent/10 rounded" />
            </div>
            {/* Badge */}
            <div className="h-5 w-16 bg-accent/10 rounded" />
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <div className="h-2 w-16 bg-accent/10 rounded" />
              <div className="h-2 w-6 bg-accent/20 rounded" />
            </div>
            <div className="h-[3px] bg-accent/10 rounded" />
          </div>

          {/* Avatars */}
          <div className="flex gap-1 flex-wrap">
            <div className="h-4 w-12 bg-accent/10 rounded" />
            <div className="h-4 w-14 bg-accent/10 rounded" />
            <div className="h-4 w-10 bg-accent/10 rounded" />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 mt-auto pt-2 border-t border-accent/5">
            <div className="flex-1 h-[27px] bg-accent/10 rounded" />
            <div className="flex-1 h-[27px] bg-accent/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
