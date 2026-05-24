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
        className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col rounded-t-2xl border-t transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          height: '92dvh',
          maxHeight: 'calc(100vh - 8px)',
          background: "color-mix(in srgb, var(--card) 14%, rgba(var(--arena-black-rgb),0.94))",
          borderColor: "rgba(var(--arena-white-rgb),0.12)",
          boxShadow: "0 -24px 64px rgba(var(--arena-black-rgb),0.75), inset 0 1px 0 rgba(var(--arena-white-rgb),0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transform: `translateY(${translateY}%)`,
          touchAction: 'none',
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-full flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="h-1 w-10 rounded-full"
            style={{ background: "rgba(var(--arena-white-rgb),0.22)" }}
          />
        </div>

        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-3 pb-2.5 pt-0.5"
          style={{ borderColor: "rgba(var(--arena-white-rgb),0.08)" }}
        >
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--arena-white)" }}>
              {title}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(var(--arena-white-rgb),0.45)" }}>
              Visual block editor
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm transition-colors duration-200"
            style={{
              color: "rgba(var(--arena-white-rgb),0.55)",
              background: "rgba(var(--arena-white-rgb),0.06)",
              border: "1px solid rgba(var(--arena-white-rgb),0.1)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content — fills remaining space with flex-1 + overflow scroll */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </>
  );
};
