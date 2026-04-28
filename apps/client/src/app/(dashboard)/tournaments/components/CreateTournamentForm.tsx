import React, { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (name: string) => void;
  creating: boolean;
  isMobile?: boolean;
}

export function CreateTournamentForm({ onClose, onCreate, creating, isMobile }: Props) {
  const [name, setName] = useState("");
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className={`mb-8 ${isMobile ? "p-5" : "p-6"} rounded-xl bg-card/20 border border-accent/20 backdrop-blur-xl animate-[fadeIn_0.25s_ease] flex ${isMobile ? "flex-col" : "gap-4"} items-stretch relative overflow-hidden group`}>
      {/* Accent glow for the form container */}
      <div className="absolute inset-0 bg-accent/[0.02] pointer-events-none group-hover:bg-accent/[0.04] transition-colors" />

      <div className="flex-1 flex flex-col gap-2 relative z-10">
        <label className="text-[10px] font-black tracking-[0.3em] text-accent/70 uppercase pl-1 flex justify-between items-center">
          <span>TOURNAMENT NAME</span>
          {isMobile && (
            <button
              onClick={onClose}
              className="text-red-500/40 hover:text-red-500 transition-colors p-1"
            >
              ✕
            </button>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter tournament name..."
            className={`w-full ${isMobile ? "py-4 text-[13px]" : "py-3 text-[12px]"} px-4 bg-black/40 border border-accent/20 rounded-lg text-accent font-mono tracking-[0.1em] outline-none focus:border-accent/60 focus:bg-black/60 transition-all placeholder:opacity-60`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-accent/10 pointer-events-none">
            ONLINE
          </div>
        </div>
      </div>

      <div className={`flex ${isMobile ? "mt-4 gap-2" : "items-end"} relative z-10`}>
        <button
          onClick={handleSubmit}
          disabled={creating || !name.trim()}
          onMouseEnter={() => setHoveredBtn("deploy")}
          onMouseLeave={() => setHoveredBtn(null)}
          className={`flex-1 ${isMobile ? "py-4" : "py-3 px-8"} rounded-lg text-[10px] font-black tracking-[0.3em] font-mono transition-all duration-200 uppercase relative overflow-hidden ${creating ? 'cursor-wait opacity-50' : 'cursor-pointer'
            } ${!name.trim() ? "opacity-30 grayscale" : ""} ${hoveredBtn === "deploy"
              ? "bg-emerald-500/20 border border-emerald-500/70 text-emerald-500 shadow-[0_0_20px_rgba(var(--color-emerald-500),0.15)]"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500/60"
            }`}
        >
          {creating ? "CREATING..." : "▶ CREATE TOURNAMENT"}
        </button>

        {!isMobile && (
          <button
            onClick={onClose}
            className="ml-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg text-red-500/40 text-[11px] font-bold tracking-[0.15em] font-mono cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
