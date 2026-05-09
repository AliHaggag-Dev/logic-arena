import React from "react";

interface Props {
  isMobile: boolean;
  subtitle: string;
  icon: React.ReactNode;
}

export function AuthHeader({ isMobile, subtitle, icon }: Props) {
  return (
    <div className="mb-8 text-center flex flex-col items-center">
      <div className="w-10 h-10 mb-4 border border-accent/30 rounded-full flex items-center justify-center bg-accent/5 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]">
        <span className="text-accent shadow-accent flex items-center justify-center">{icon}</span>
      </div>
      <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} text-accent font-black tracking-[0.2em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.6)] mb-2 uppercase`}>
        LOGIC ARENA
      </h1>
      <h2 className="text-accent/70 text-[10px] tracking-[0.3em] uppercase">
        [ {subtitle} ]
      </h2>
    </div>
  );
}
