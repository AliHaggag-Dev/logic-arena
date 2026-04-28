import React from "react";

export function HeroSection({ isMobile }: { isMobile: boolean }) {
  return (
    <div className={`border-b border-accent/10 ${isMobile ? "pb-6 mb-8" : "pb-9 mb-[52px]"} text-center`}>
      <h1 className={`${isMobile ? "text-3xl" : "text-[clamp(32px,6vw,56px)]"} font-black tracking-[0.22em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.9)] mb-4 leading-none`}>
        <p className="text-[10px] tracking-[0.4em] text-accent/30 mb-3 uppercase drop-shadow-none">
          LANGUAGE REFERENCE
        </p>
        ALISCRIPT
        <span className="text-[0.38em] text-accent/35 tracking-[0.3em] ml-4 align-super">
          v2.0
        </span>
      </h1>

      <p className={`${isMobile ? "text-[10px] tracking-[0.15em]" : "text-[13px] tracking-[0.28em]"} text-accent/45 uppercase m-0`}>
        THE ROBOT PROGRAMMING LANGUAGE
      </p>

      {/* Decorative line */}
      <div className={`mx-auto mt-7 ${isMobile ? "max-w-[150px]" : "max-w-[320px]"} h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30`} />

      {/* Status badges */}
      <div className={`flex justify-center ${isMobile ? "gap-2" : "gap-4"} mt-6 flex-wrap`}>
        {[
          { label: "SECTIONS", value: "10" },
          { label: "LOGIC TYPES", value: "6" },
          { label: "CORE", value: "v2.0" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className={`${isMobile ? "px-3 py-1 text-[9px]" : "px-4 py-1.5 text-[10px]"} border border-accent/20 rounded-lg bg-accent/5 tracking-[0.18em] text-accent/50 flex gap-2 items-center shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.02)]`}
          >
            <span className="text-accent/30">{label}:</span>
            <span className="text-accent font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
