'use client';

import React, { useEffect, useState, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isMobile: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isMobile,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [translateY, setTranslateY] = useState(100);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setTranslateY(0), 10);
    } else {
      setTranslateY(100);
      const timeout = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      const newTranslate = (deltaY / (sheetRef.current?.offsetHeight || 1)) * 100;
      setTranslateY(newTranslate);
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 25) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  if (!isMobile || !isRendered) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className={`fixed inset-0 z-[60] transition-opacity duration-300 border-0 outline-none p-0 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={{ background: 'linear-gradient(to top, rgba(var(--arena-black-rgb),0.9) 50%, rgba(var(--arena-black-rgb),0.4) 100%)' }}
        onClick={onClose}
      />

      {/* Sheet — 85dvh gives nearly full-screen with peek at arena behind */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-black/95 backdrop-blur-2xl border-t border-cyan-500/30 rounded-t-2xl shadow-[0_-10px_60px_rgba(var(--arena-black-rgb),0.9),0_-4px_20px_rgba(var(--arena-cyan-rgb),0.08)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col"
        style={{
          height: '85dvh',
          maxHeight: 'calc(100vh - 40px)',
          transform: `translateY(${translateY}%)`,
          touchAction: 'none',
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-cyan-500/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-cyan-500/15 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_rgba(var(--arena-cyan-rgb),0.8)]" />
            <span className="text-cyan-400 text-[9px] font-black tracking-[0.4em] uppercase">{title}</span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-cyan-600 hover:text-cyan-300 text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content — fills remaining space with flex-1 + overflow scroll */}
        <div
          className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-5 py-4 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </>
  );
};
