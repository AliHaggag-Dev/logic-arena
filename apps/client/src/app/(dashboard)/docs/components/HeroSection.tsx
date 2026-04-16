import React from "react";

export function HeroSection() {
  return (
    <div className="border-b border-[#22d3ee]/10 pb-9 mb-[52px] text-center">
      <h1 className="text-[clamp(32px,6vw,56px)] font-black tracking-[0.22em] text-[#22d3ee] drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] mb-4 leading-none">
        <p className="text-[9px] tracking-[0.4em] text-[#22d3ee]/30 mb-3 uppercase drop-shadow-none">
          // LANGUAGE_REFERENCE_v2.0_SENTIENT_UPDATE
        </p>
        ALISCRIPT
        <span className="text-[0.38em] text-[#22d3ee]/35 tracking-[0.3em] ml-4 align-super">
          v2.0
        </span>
      </h1>
      
      <p className="text-[13px] text-[#22d3ee]/45 tracking-[0.28em] uppercase m-0">
        The Combat Programming Language
      </p>

      {/* Decorative line */}
      <div className="mx-auto mt-7 max-w-[320px] h-[1px] bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent opacity-30" />

      {/* Status badges */}
      <div className="flex justify-center gap-4 mt-6 flex-wrap">
        {[
          { label: "MODULES", value: "10" },
          { label: "PARADIGMS", value: "6" },
          { label: "CORE", value: "v2.0 READY" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="px-4 py-1.5 border border-[#22d3ee]/20 rounded bg-[#22d3ee]/5 text-[9px] tracking-[0.18em] text-[#22d3ee]/50 flex gap-2 items-center"
          >
            <span className="text-[#22d3ee]/30">{label}:</span>
            <span className="text-[#22d3ee] font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
