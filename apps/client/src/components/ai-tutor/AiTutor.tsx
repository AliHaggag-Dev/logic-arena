'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAiChat } from './use-ai-chat';
import { ChatTrigger } from './chat-trigger';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ARIA_SUPPRESSED_PREFIXES } from './constants';

export function AiTutor({ isMobile: isMobileProp }: { isMobile?: boolean }) {
  const pathname = usePathname() ?? '';
  const isMobileDefault = useMediaQuery('(max-width: 768px)');
  const isMobile = isMobileProp ?? isMobileDefault;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { messages, status, streamedText, isActive, sendMessage, clearChat, abort, messagesEndRef } = useAiChat();

  const isSuppressed = ARIA_SUPPRESSED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSend = (image?: string | null) => {
    sendMessage(input, image);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only used for other keys now, Enter is handled inside ChatInput
  };

  if (isSuppressed) return null;

  return (
    <>
      <style>{`
        .ai-placeholder::placeholder {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .ai-placeholder:focus::placeholder {
          opacity: 0.3;
        }
        .ai-placeholder:not(:placeholder-shown)::placeholder {
          opacity: 0;
          transform: translateX(6px);
        }
      `}</style>

      {!open && (
        <ChatTrigger isMobile={isMobile} onClick={() => setOpen(true)} />
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end" style={{ pointerEvents: 'none' }}>
          {isMobile && (
            <div
              className="fixed inset-0 bg-card/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              style={{ pointerEvents: 'auto' }}
            />
          )}

          <div
            className={`bg-bg-primary border border-accent/30 flex flex-col ${isMobile
                ? 'fixed inset-0 rounded-none'
                : 'relative w-[420px] h-[600px] rounded-tl-2xl mr-6 mb-6'
              }`}
            style={{
              pointerEvents: 'auto',
              boxShadow: isMobile ? undefined : '0 0 40px rgba(var(--accent-rgb),0.15)',
              animation: 'fadeIn 0.2s ease',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="ARIA AI Tutor chat"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-accent/10 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bot size={15} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary leading-tight tracking-tight">
                  ARIA
                </p>
                <p className="text-[10px] text-text-secondary/50 leading-tight">
                  AliScript Tutor &middot; Online
                </p>
              </div>
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{
                  backgroundColor: 'var(--sem-success)',
                  boxShadow: '0 0 8px var(--sem-success)',
                }}
              />
              <div className="w-px h-5 bg-accent/10 mx-1 shrink-0" />
              <button
                type="button"
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-accent/10 text-text-secondary/40 hover:text-text-secondary/70 transition-colors"
                aria-label="Clear chat history"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-accent/10 text-text-secondary/40 hover:text-text-secondary/70 transition-colors"
                aria-label="Close AI Tutor"
              >
                <X size={14} />
              </button>
            </div>

            <ChatMessages
              messages={messages}
              status={status}
              streamedText={streamedText}
              onSendQuestion={sendMessage}
              messagesEndRef={messagesEndRef}
            />

            <ChatInput
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              isActive={isActive}
              onAbort={abort}
              inputRef={inputRef}
            />
          </div>
        </div>
      )}
    </>
  );
}
