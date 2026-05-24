"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface BlockSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function mergeOptions(options: string[], current: string): string[] {
  return options.includes(current) ? options : [current, ...options];
}

export function BlockSelect({ label, value, options, onChange }: BlockSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mergedOptions = mergeOptions(options, value);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative min-w-[120px] max-w-full"
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-2.5 text-left transition-[border-color,box-shadow,background] duration-200"
        style={{
          color: "var(--arena-white)",
          background: isOpen ? "rgba(var(--arena-cyan-rgb),0.1)" : "rgba(var(--arena-white-rgb),0.06)",
          border: isOpen ? "1px solid rgba(var(--arena-cyan-rgb),0.45)" : "1px solid rgba(var(--arena-white-rgb),0.14)",
          boxShadow: isOpen ? "0 0 0 3px rgba(var(--arena-cyan-rgb),0.08)" : "inset 0 1px 0 rgba(var(--arena-white-rgb),0.06)",
        }}
      >
        <span className="truncate font-mono text-[10px] font-medium">{value}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
          style={{
            color: "rgba(var(--arena-white-rgb),0.45)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] overflow-hidden rounded-xl"
          style={{
            background: "color-mix(in srgb, var(--card) 16%, rgba(var(--arena-black-rgb),0.96))",
            border: "1px solid rgba(var(--arena-white-rgb),0.14)",
            boxShadow: "0 16px 40px rgba(var(--arena-black-rgb),0.55), inset 0 1px 0 rgba(var(--arena-white-rgb),0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="max-h-48 overflow-y-auto overscroll-contain py-1">
            {mergedOptions.map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2.5 text-left transition-colors duration-150"
                  style={{
                    color: isSelected ? "var(--arena-cyan)" : "rgba(var(--arena-white-rgb),0.82)",
                    background: isSelected ? "rgba(var(--arena-cyan-rgb),0.12)" : "transparent",
                  }}
                >
                  <span className="truncate font-mono text-[10px] font-medium">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
