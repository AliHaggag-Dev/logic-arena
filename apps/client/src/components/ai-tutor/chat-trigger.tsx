'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, MessageSquareText } from 'lucide-react';

interface ChatTriggerProps {
  isMobile: boolean;
  onClick: () => void;
}

export function ChatTrigger({ isMobile, onClick }: ChatTriggerProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mobileExpanded) {
      setBubbleVisible(true);
      const t = setTimeout(() => {
        setBubbleVisible(false);
        setTimeout(() => setMobileExpanded(false), 300); // Wait for bubble to fade
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [mobileExpanded]);

  useEffect(() => {
    if (!mobileExpanded) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setBubbleVisible(false);
        setTimeout(() => setMobileExpanded(false), 300);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileExpanded]);

  const handleClick = () => {
    if (isMobile) {
      if (!mobileExpanded) {
        setMobileExpanded(true);
      } else {
        setMobileExpanded(false);
        setBubbleVisible(false);
        onClick();
      }
    } else {
      onClick();
    }
  };
  const triggerPositionClass = isMobile
    ? `fixed bottom-[88px] left-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[100] ${
        mobileExpanded ? 'translate-x-0' : '-translate-x-[calc(100%-24px)]'
      }`
    : `fixed bottom-12 right-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[100] translate-x-[calc(100%-42px)] hover:translate-x-0`;

  const bubbleText = "Welcome Operator! I'm ARIA, your personal AI companion. Ready to assist!";

  // Desktop uses group-hover for the bubble, mobile uses the bubbleVisible state
  const bubble = isMobile ? (
    <div
      className={`absolute bottom-full left-0 mb-3 w-[200px] p-3 rounded-2xl rounded-bl-none border border-accent/30 bg-bg-primary/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(var(--accent-rgb),0.15)] text-[10px] leading-relaxed text-accent/90 font-mono tracking-wide transition-all duration-300 origin-bottom-left ${
        bubbleVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
      }`}
    >
      {bubbleText}
      <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-2 bg-accent/15 border border-accent/30 rounded-lg text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)] animate-pulse">
        <MessageSquareText size={12} />
        <span className="uppercase text-[8px] tracking-[0.2em] pt-px">Tap again to chat</span>
      </div>
    </div>
  ) : (
    <div
      className="absolute bottom-full right-0 mb-3 w-[220px] p-3.5 rounded-2xl rounded-br-none border border-accent/30 bg-bg-primary/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(var(--accent-rgb),0.15)] text-[11px] leading-relaxed text-accent/90 font-mono tracking-wide transition-all duration-300 origin-bottom-right opacity-0 scale-95 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
    >
      {bubbleText}
      <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-2 bg-accent/15 border border-accent/30 rounded-lg text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)] animate-pulse">
        <MessageSquareText size={13} />
        <span className="uppercase text-[9px] tracking-[0.2em] pt-px">Click to initiate</span>
      </div>
    </div>
  );

  const triggerContent = isMobile ? (
    <>
      <Bot size={20} className="shrink-0" />
      {bubble}
    </>
  ) : (
    <>
      <Bot size={18} className="shrink-0" />
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">ARIA</span>
      {bubble}
    </>
  );

  const triggerClass = isMobile
    ? `${triggerPositionClass} group flex items-center justify-end w-[48px] h-[48px] pr-2 rounded-r-2xl rounded-l-none border border-l-0 border-accent/40 bg-bg-primary/95 backdrop-blur-md text-accent cursor-pointer shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`
    : `${triggerPositionClass} group flex items-center gap-2 pl-3 pr-4 py-3 rounded-l-2xl rounded-r-none border border-r-0 border-accent/40 bg-bg-primary/95 backdrop-blur-md text-accent font-mono text-[11px] tracking-[0.18em] font-bold hover:bg-accent/10 cursor-pointer shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`;

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      className={triggerClass}
      style={{
        boxShadow: '0 0 20px rgba(var(--accent-rgb),0.2), 0 0 40px rgba(var(--accent-rgb),0.1)',
      }}
      aria-label="Open ARIA AI Tutor"
    >
      {triggerContent}
    </button>
  );
}
