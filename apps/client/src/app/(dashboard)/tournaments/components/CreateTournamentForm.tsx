import React, { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (name: string) => void;
  creating: boolean;
}

export function CreateTournamentForm({ onClose, onCreate, creating }: Props) {
  const [name, setName] = useState("");
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className="mb-8 p-6 rounded-xl bg-card/60 border border-accent/20 backdrop-blur-xl animate-[fadeIn_0.25s_ease] flex gap-3 items-center">
      <div className="text-[10px] tracking-[0.22em] text-accent/30 uppercase whitespace-nowrap">
        NAME:
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="ENTER TOURNAMENT DESIGNATION..."
        className="flex-1 px-3.5 py-2.5 bg-card/60 border border-accent/20 rounded-md text-accent text-[12px] font-mono tracking-[0.08em] outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={creating || !name.trim()}
        onMouseEnter={() => setHoveredBtn("deploy")}
        onMouseLeave={() => setHoveredBtn(null)}
        className={`px-6 py-2.5 rounded-md text-[10px] font-black tracking-[0.22em] font-mono transition-all duration-200 ${
          creating ? 'cursor-wait' : 'cursor-pointer'
        } ${!name.trim() ? "opacity-40" : ""} ${
          hoveredBtn === "deploy"
            ? "bg-emerald-500/20 border-emerald-500/70 text-emerald-500"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500/70"
        }`}
        style={{ borderWidth: "1px" }}
      >
        {creating ? "DEPLOYING..." : "▶ DEPLOY"}
      </button>
      <button
        onClick={onClose}
        className="px-3.5 py-2.5 bg-red-500/5 border border-red-500/20 rounded-md text-red-500/50 text-[10px] font-bold tracking-[0.15em] font-mono cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:text-red-500/70"
      >
        ✕
      </button>
    </div>
  );
}
