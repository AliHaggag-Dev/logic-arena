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
    if (translateY > 30) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  if (!isMobile || !isRendered) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 45%, transparent 100%)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-black/85 backdrop-blur-2xl border-t border-cyan-500/20 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          height: '48vh',
          transform: `translateY(${translateY}%)`,
          touchAction: 'none',
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-cyan-500/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-3 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
            <span className="text-cyan-400 text-[9px] font-black tracking-[0.4em] uppercase">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-600 hover:text-cyan-300 text-lg transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content sheet */}
        <div
          className="overflow-y-auto px-6 py-4"
          style={{ height: 'calc(48vh - 72px)', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </>
  );
};