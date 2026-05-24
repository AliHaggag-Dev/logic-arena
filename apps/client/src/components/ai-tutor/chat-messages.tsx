'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, ChevronDown } from 'lucide-react';
import { markdownComponents } from './markdown-components';
import { TypingIndicator } from './typing-indicator';
import { SUGGESTED_QUESTIONS } from './constants';
import type { ChatMessage } from './types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  status: 'idle' | 'thinking' | 'streaming';
  streamedText: string;
  onSendQuestion: (msg: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  status,
  streamedText,
  onSendQuestion,
  messagesEndRef,
}: ChatMessagesProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [userScrolled, setUserScrolled] = React.useState(false);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isAtBottom);
    setUserScrolled(!isAtBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserScrolled(false);
    setShowScrollButton(false);
  };

  React.useEffect(() => {
    // Only scroll automatically when a new message is added to the array (like the user's question or bot's final answer)
    // We intentionally don't include streamedText so we don't drag the user down while they are trying to read the beginning of a long response
    if (!userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); // Only depend on messages.length

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 cursor-text"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
      {messages.length === 0 && status === 'idle' && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/8 flex items-center justify-center mb-5">
            <Bot size={26} className="text-accent/40" />
          </div>
          <p className="text-text-secondary/60 text-[13px] mb-1">
            Ask me anything about AliScript
          </p>
          <p className="text-text-secondary/30 text-[11px] mb-8">
            I&apos;m your personal ARIA tutor
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[300px]">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSendQuestion(q)}
                className="px-2.5 py-1 rounded-full border border-accent/15 text-text-secondary/50 hover:text-text-secondary hover:border-accent/35 text-[11px] leading-normal transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                ? 'bg-accent/15 text-text-primary'
                : msg.isError
                  ? 'bg-sem-danger/8 border border-sem-danger/20'
                  : 'bg-card border border-accent/[0.07]'
              }`}
          >
            {msg.role === 'model' && (
              <p className={`text-[10px] font-semibold mb-1.5 tracking-wide uppercase ${msg.isError ? 'text-sem-danger/60' : 'text-accent/50'
                }`}>
                {msg.isError ? 'ARIA \u2022 Error' : 'ARIA'}
              </p>
            )}
            {msg.image && (
              <div className="mb-3">
                <img src={msg.image} alt="Attached" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-accent/20 shadow-md" />
              </div>
            )}
            <div dir="auto" className={`text-[13px] leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 ${msg.isError ? 'text-sem-danger/80' : ''
              }`} style={{ fontFamily: 'var(--font-alexandria), sans-serif' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}

      {status === 'thinking' && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-card border border-accent/[0.07]">
            <p className="text-[10px] font-semibold text-accent/50 mb-2 tracking-wide uppercase">
              ARIA
            </p>
            <TypingIndicator />
          </div>
        </div>
      )}

      {status === 'streaming' && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-card border border-accent/[0.07]">
            <p className="text-[10px] font-semibold text-accent/50 mb-1.5 tracking-wide uppercase">
              ARIA
            </p>
            <div dir="auto" className="text-[13px] leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 overflow-hidden" style={{ fontFamily: 'var(--font-alexandria), sans-serif', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {streamedText + ' \u258b'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center hover:bg-accent/30 transition-all shadow-lg backdrop-blur-md"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
}
