import React from "react";

export const OnlineDot = ({ isOnline }: { isOnline: boolean }) => (
  <span
    className={`w-2 h-2 rounded-full shrink-0 ${
      isOnline
        ? "bg-emerald-500 shadow-[0_0_6px_rgba(var(--sem-success-rgb),0.7)]"
        : "bg-accent/15"
    }`}
  />
);
