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
        className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col rounded-t-2xl border-t transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          height: '92dvh',
          maxHeight: 'calc(100vh - 8px)',
          background: "var(--arena-black)",
          borderColor: "rgba(var(--arena-white-rgb),0.12)",
          boxShadow: "0 -24px 64px rgba(var(--arena-black-rgb),0.9), inset 0 1px 0 rgba(var(--arena-white-rgb),0.06)",
          transform: `translateY(${translateY}%)`,
          touchAction: 'none',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex w-full shrink-0 cursor-grab flex-col items-center pb-0.5 pt-1.5 active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="h-1 w-10 rounded-full"
            style={{ background: "rgba(var(--arena-white-rgb),0.22)" }}
          />
        </div>

        {/* Header - Close Button */}
        <div
          className="absolute top-1 right-1 z-[110]"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-transform duration-200 active:scale-95"
            style={{
              color: "white",
              background: "#ef4444", // solid red-500
              border: "1px solid #dc2626", // solid red-600
              boxShadow: "0 4px 10px rgba(239, 68, 68, 0.4)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content — fills remaining space with flex-1 + overflow scroll */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-1 md:px-2.5 py-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </>
  );
};
