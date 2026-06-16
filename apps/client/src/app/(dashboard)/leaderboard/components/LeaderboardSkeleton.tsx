import React from "react";

interface LeaderboardSkeletonProps {
  /** "table" renders <tr>/<td> rows for the desktop table.
   *  "card" renders <div> cards for the mobile list. */
  variant?: "table" | "card";
  /** Number of skeleton rows to render */
  count?: number;
}

const SKELETON_ROWS = [1, 2, 3, 4, 5];

export const LeaderboardSkeleton = ({
  variant = "table",
  count = SKELETON_ROWS.length,
}: LeaderboardSkeletonProps) => {
  const rows = Array.from({ length: count }, (_, i) => i + 1);

  if (variant === "card") {
    return (
      <>
        {rows.map((i) => (
          <div
            key={i}
            className="bg-card border border-accent/10 rounded-xl p-4 flex flex-col gap-4 animate-pulse"
            style={{ willChange: "transform" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-8 bg-accent/10 rounded" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 bg-accent/10 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-accent/10 rounded" />
            </div>
            <div className="h-[44px] w-full bg-accent/5 rounded-lg border border-accent/10" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {rows.map((i) => (
        <tr key={i} className="border-b border-accent/10 animate-pulse" style={{ willChange: "transform" }}>
          {/* Rank */}
          <td className="px-6 py-4">
            <div className="h-5 w-8 bg-accent/10 rounded" />
          </td>
          {/* Player */}
          <td className="px-6 py-4">
            <div className="h-5 w-32 bg-accent/10 rounded" />
          </td>
          {/* Points */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-8 bg-accent/10 rounded" />
              <div className="h-1 w-20 bg-accent/5 rounded-full hidden xl:block" />
            </div>
          </td>
          {/* Victories */}
          <td className="px-6 py-4">
            <div className="h-5 w-6 bg-accent/10 rounded" />
          </td>
          {/* Efficiency */}
          <td className="px-6 py-4">
            <div className="flex items-center justify-end">
              <div className="h-5 w-20 bg-accent/10 rounded" />
            </div>
          </td>
          {/* Action */}
          <td className="px-6 py-4">
            <div className="flex items-center justify-end pr-2">
              <div className="h-7 w-24 bg-accent/5 rounded border border-accent/10" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};
