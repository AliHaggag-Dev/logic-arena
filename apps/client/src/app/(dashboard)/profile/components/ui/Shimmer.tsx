"use client";

import React from "react";

interface Props {
  className?: string;
}

export function Shimmer({ className }: Props) {
  return (
    <div
      className={`rounded-lg animate-[shimmer_1.5s_infinite] ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 0%, rgba(var(--accent-rgb),0.09) 50%, rgba(var(--accent-rgb),0.03) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}
