import React from "react";

export function SectionLabel({ text, isMobile }: { text: string, isMobile?: boolean }) {
  return (
    <div className={`flex items-center ${isMobile ? "gap-2" : "gap-3"} mb-1`}>
      <span className={`${isMobile ? "text-[9px]" : "text-[10px]"} tracking-[0.3em] text-accent/35 font-bold uppercase`}>
        {'// '}{text}
      </span>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
    </div>
  );
}
