"use client";

import React from "react";

function calcStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export const STRENGTH_LABELS = ["WEAK", "POOR", "FAIR", "GOOD", "STRONG", "MAX"];
export const STRENGTH_COLORS = [
  "var(--sem-danger)",
  "var(--sem-warning)",
  "var(--sem-warning)",
  "var(--sem-success)",
  "var(--sem-success)",
  "var(--accent)",
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = calcStrength(password);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? "" : "bg-bg-secondary border border-accent/10"}`}
            style={i < strength ? { backgroundColor: STRENGTH_COLORS[strength] } : undefined}
          />
        ))}
      </div>
      <span className="text-[9px] tracking-[0.2em] text-accent/50 font-bold">
        {STRENGTH_LABELS[strength]}
      </span>
    </div>
  );
}
