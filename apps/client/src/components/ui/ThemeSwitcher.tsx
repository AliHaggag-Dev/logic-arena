"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { id: "cyberpunk", label: "CYBERPUNK", icon: "🌙" },
  { id: "light", label: "LIGHT", icon: "☀️" },
  { id: "desert", label: "DESERT", icon: "🌅" },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="px-[10px] pb-3 relative z-10">
      <div className="text-[8px] tracking-[0.22em] text-accent/25 font-bold px-1 pb-1.5 uppercase">
        theme
      </div>
      <div className="flex gap-1.5">
        {THEMES.map(({ id, label, icon }) => {
          const isActive = theme === id;
          return (
            <button
              key={id}
              onClick={() => setTheme(id)}
              title={label}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md text-[10px] font-mono font-bold tracking-[0.05em] border transition-all duration-200 cursor-pointer ${isActive
                  ? "bg-accent/10 border-accent/50 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)]"
                  : "bg-transparent border-accent/10 text-accent/30 hover:border-accent/30 hover:text-accent/60 hover:bg-accent/5"
                }`}
            >
              <span className="text-[14px] leading-none">{icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
