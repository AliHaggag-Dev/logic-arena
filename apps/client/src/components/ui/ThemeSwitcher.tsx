"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

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

interface ThemeSwitcherProps {
  variant?: "default" | "minimal";
  size?: "compact" | "touch";
}

export function ThemeSwitcher({ variant = "default", size = "compact" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => { setMounted(true); }, []);

  const updatePos = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (variant === "minimal") {
        setDropdownStyle({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
          minWidth: 140
        });
      } else {
        setDropdownStyle({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: rect.width
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
      return () => {
        window.removeEventListener("scroll", updatePos, true);
        window.removeEventListener("resize", updatePos);
      };
    }
  }, [isOpen, variant]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  const currentIcon = theme === "cyberpunk" ? <Moon size={14} /> : theme === "light" ? <Sun size={14} /> : <Sunrise size={14} />;
  const minimalButtonClassName = size === "touch"
    ? "flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors duration-150 cursor-pointer"
    : "flex items-center justify-center w-[28px] h-[28px] rounded-md border border-accent/20 bg-accent/5 text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors duration-150 cursor-pointer";

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
    <div className={variant === "minimal" ? "relative z-[110]" : "px-[10px] pb-3 relative z-[110]"}>
      {variant === "default" && (
        <div className="text-[8px] tracking-[0.22em] text-accent/25 font-bold px-1 pb-1.5 uppercase">
          theme
        </div>
      )}
      <div className={variant === "minimal" ? "" : "w-full relative"}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={variant === "minimal"
            ? minimalButtonClassName
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

        {mounted && createPortal(
          <div
            ref={dropdownRef}
            className={`fixed bg-card border border-accent/50 rounded-lg p-1 z-[99999] transition-all duration-150 ease-in-out ${isOpen ? "opacity-100 translate-y-0 visible" : `opacity-0 ${variant === "minimal" ? "-translate-y-2" : "translate-y-2"} invisible`}`}
            style={{ ...dropdownStyle, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          >
            {THEMES.map(({ id, label, icon }) => {
              const isActive = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[10px] font-mono font-bold tracking-[0.05em] transition-colors duration-150 ${isActive ? "bg-accent/10 text-accent" : "bg-transparent text-text-secondary hover:bg-accent/5 hover:text-accent/80"}`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
