"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

const SVGBase = ({ children, size = 14 }: { children: React.ReactNode, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Moon = ({ size }: { size?: number }) => (
  <SVGBase size={size}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </SVGBase>
);

const Sun = ({ size }: { size?: number }) => (
  <SVGBase size={size}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </SVGBase>
);

const Sunrise = ({ size }: { size?: number }) => (
  <SVGBase size={size}>
    <path d="M12 2v6" />
    <path d="m8.46 10.46-1.42 1.42" />
    <path d="m15.54 10.46 1.42 1.42" />
    <path d="M2 18h20" />
    <path d="M3 14h1" />
    <path d="M20 14h1" />
    <path d="M12 22v-3" />
    <path d="M8 22v-3" />
    <path d="M16 22v-3" />
  </SVGBase>
);

export function ThemeSwitcher({ variant = "default" }: { variant?: "default" | "minimal" }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  const currentIcon = theme === "cyberpunk" ? <Moon size={14} /> : theme === "light" ? <Sun size={14} /> : <Sunrise size={14} />;

  const THEMES = [
    { id: "cyberpunk", label: "CYBERPUNK", icon: <Moon size={14} /> },
    { id: "light", label: "LIGHT", icon: <Sun size={14} /> },
    { id: "desert", label: "DESERT", icon: <Sunrise size={14} /> },
  ] as const;

  const handleSelect = (id: string) => {
    setTheme(id);
    setIsOpen(false);
  };

  return (
    <div className={variant === "minimal" ? "relative z-50" : "px-[10px] pb-3 relative z-50"} ref={dropdownRef}>
      {variant === "default" && (
        <div className="text-[8px] tracking-[0.22em] text-accent/25 font-bold px-1 pb-1.5 uppercase">
          theme
        </div>
      )}
      <div className={variant === "minimal" ? "" : "w-full relative"}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={variant === "minimal"
            ? "flex items-center justify-center w-[28px] h-[28px] rounded-md border border-accent/20 bg-accent/5 text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors duration-150"
            : "flex items-center justify-between w-full px-3 py-2 rounded-md border border-accent/20 bg-accent/5 text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors duration-150 text-[10px] font-mono tracking-widest font-bold"
          }
        >
          {variant === "minimal" ? currentIcon : (
            <>
              <span className="flex items-center gap-2">{currentIcon} {theme?.toUpperCase() || "THEME"}</span>
              <span className="opacity-50 text-[8px]">▼</span>
            </>
          )}
        </button>

        <div 
          className={`absolute ${variant === "minimal" ? "top-[calc(100%+8px)] right-0 min-w-[140px]" : "bottom-[calc(100%+8px)] left-0 right-0"} bg-card border border-border rounded-lg p-1 z-50 transition-all duration-150 ease-in-out ${isOpen ? "opacity-100 translate-y-0 visible" : `opacity-0 ${variant === "minimal" ? "-translate-y-2" : "translate-y-2"} invisible`}`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {THEMES.map(({ id, label, icon }) => {
            const isActive = theme === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[10px] font-mono font-bold tracking-[0.05em] transition-colors duration-150 ${isActive ? "bg-accent/10 text-accent" : "bg-transparent text-text-secondary hover:bg-accent/5 hover:text-accent/80"}`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
