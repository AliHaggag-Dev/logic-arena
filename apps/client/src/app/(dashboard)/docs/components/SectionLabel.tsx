import React from "react";

export function SectionLabel({ text, isMobile }: { text: string, isMobile?: boolean }) {
  return (
    <div className={`flex items-center ${isMobile ? "gap-2" : "gap-3"} mb-1`}>
      <h2 className={`${isMobile ? "text-[9px]" : "text-[10px]"} tracking-[0.3em] text-accent/60 font-bold uppercase m-0`}>
        {'// '}{text}
      </h2>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
    </div>
  );
}
