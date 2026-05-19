"use client";
import React from "react";

interface StatItemProps {
  label: string;
  value: string | number;
  accent: boolean;
  isMobile?: boolean;
  brandColor: string;
}

export const StatItem = ({ label, value, accent, isMobile, brandColor }: StatItemProps) => (
  <div className={`flex flex-col items-center ${isMobile ? "min-w-[32px]" : "min-w-[48px]"}`}>
    {!isMobile && (
      <span
        className="font-mono text-[8px] tracking-widest mb-1"
        style={{ color: accent ? "rgba(255,0,85,0.7)" : `${brandColor}80` }}
      >
        {label}
      </span>
    )}
    <span className={`font-mono font-bold tabular-nums ${isMobile ? "text-[8px]" : "text-sm"} ${accent ? "text-[#ff0055]" : "text-white"}`}>
      {value}
    </span>
    {isMobile && (
      <span
        className="font-mono text-[5px] uppercase mt-0.5"
        style={{ color: accent ? "#ff0055" : brandColor, opacity: 0.5 }}
      >
        {label}
      </span>
    )}
  </div>
);
