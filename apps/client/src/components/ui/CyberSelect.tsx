"use client";

import React, { useState, useRef, useEffect } from "react";

export interface CyberSelectOption {
  value: string;
  label: string;
  colorClass?: string;
  description?: string;
}

interface CyberSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: CyberSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function CyberSelect({ id, value, onChange, options, placeholder = "SELECT...", disabled }: CyberSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full font-mono text-[12px]" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-bg-primary/80 border ${isOpen ? 'border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] bg-accent/5' : 'border-accent/50'} rounded-lg p-3.5 text-left outline-none transition-all duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent hover:bg-accent/5'}`}
      >
        <span className={selectedOption ? (selectedOption.colorClass || "text-accent") : "text-text-secondary/60 uppercase tracking-widest font-black"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-accent ml-2 text-[10px]" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 bg-bg-primary border border-accent rounded-t-lg p-0 z-[60] shadow-[0_-4px_30px_rgba(var(--accent-rgb),0.2)] animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden">
          <div className="flex flex-col max-h-[250px] overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full flex flex-col items-start px-4 py-3 text-left transition-all duration-150 ${value === option.value ? 'bg-bg-secondary/80' : 'bg-transparent hover:bg-bg-secondary/40'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-black tracking-widest uppercase ${option.colorClass || 'text-text-secondary'}`}>
                    {option.label}
                  </span>
                </div>
                {option.description && (
                  <span className="text-[10.5px] text-text-secondary/60 mt-1 leading-tight">
                    {option.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
