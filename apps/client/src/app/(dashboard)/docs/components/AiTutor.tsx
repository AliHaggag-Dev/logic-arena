'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, X, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-client';
import type { Components } from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
}

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 10;

const SUGGESTED_QUESTIONS = [
  'What is the difference between MOVE and PATHFIND?',
  'How do I aim and fire at an enemy?',
  'Can you explain how STASIS works?',
];

const markdownComponents: Components = {
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-accent/30 hover:decoration-accent/70 hover:text-accent-bright transition-all">
        {children}
      </a>
    );
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;
    if (isInline) {
      return (
        <code className="text-accent bg-accent/10 px-1 rounded text-[13px]" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-bg-secondary border border-accent/20 rounded-lg p-3 overflow-x-auto text-[13px] leading-relaxed my-2 font-mono">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-2">
        <table className="w-full text-[12px] border-collapse border border-accent/20">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-accent/20 px-2 py-1 text-accent font-bold bg-accent/5">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border border-accent/20 px-2 py-1 text-text-secondary">
        {children}
      </td>
    );
  },
};

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      <span className="w-[5px] h-[5px] rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
      <span className="w-[5px] h-[5px] rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
      <span className="w-[5px] h-[5px] rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
    </span>
  );
}

export function AiTutor({ isMobile = false }: { isMobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'streaming'>('idle');
  const [streamedText, setStreamedText] = useState('');
  const messagesRef = useRef<ChatMessage[]>([]);
  const streamedRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, streamedText]);

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

  const sendMessage = useCallback(async (text: string) => {
    const sanitized = text.replace(/<[^>]*>/g, '').slice(0, MAX_MESSAGE_LENGTH).trim();
    if (!sanitized || status !== 'idle') return;

    const userMessage: ChatMessage = { role: 'user', content: sanitized };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStatus('thinking');
    setStreamedText('');
    streamedRef.current = '';

    const abort = new AbortController();
    abortRef.current = abort;

    let aborted = false;
    let encounteredError = false;

    try {
      const currentMessages = [...messagesRef.current, userMessage];
      const history = currentMessages.slice(-MAX_HISTORY - 1, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_BASE_URL}/ai/docs-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sanitized, history }),
        signal: abort.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                encounteredError = true;
                const errorMsg: ChatMessage = {
                  role: 'model',
                  content: `⚠️ **Server error:**\n\n${parsed.error}`,
                  isError: true,
                };
                setMessages((prev) => [...prev, errorMsg]);
                break;
              } else {
                if (!started) {
                  started = true;
                  setStatus('streaming');
                }
                streamedRef.current += parsed;
              }
              setStreamedText(streamedRef.current);
            } catch {
              /* skip malformed JSON */
            }
          }
        }

        if (encounteredError) break;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        aborted = true;
      } else {
        encounteredError = true;
        const errorMsg: ChatMessage = {
          role: 'model',
          content: '⚠️ **Connection error.**\n\nI couldn\'t reach my servers. Please check your connection and try again.',
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setStatus('idle');
      abortRef.current = null;
      if (!aborted && !encounteredError && streamedRef.current) {
        setMessages((prev) => [...prev, { role: 'model', content: streamedRef.current }]);
      }
      setStreamedText('');
      streamedRef.current = '';
    }
  }, [status]);

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleSend = () => {
    sendMessage(input);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (status !== 'idle') abortRef.current?.abort();
    setMessages([]);
    setStreamedText('');
    streamedRef.current = '';
    setStatus('idle');
  };

  const isActive = status !== 'idle';
  const charsLeft = MAX_MESSAGE_LENGTH - input.length;

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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border border-accent/40 bg-bg-primary text-accent font-mono text-[11px] tracking-[0.18em] font-bold hover:bg-accent/10 transition-all cursor-pointer"
          style={{
            boxShadow: '0 0 20px rgba(var(--accent-rgb),0.2), 0 0 40px rgba(var(--accent-rgb),0.1)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
          aria-label="Open ARIA AI Tutor"
        >
          <Bot size={18} />
          ARIA
        </button>
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
            {/* ── Header ── */}
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

            {/* ── Messages ── */}
            <div
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
                        onClick={() => sendMessage(q)}
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
                        {msg.isError ? 'ARIA • Error' : 'ARIA'}
                      </p>
                    )}
                    <div className={`text-[13px] leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 ${msg.isError ? 'text-sem-danger/80' : ''
                      }`}>
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
                    <div className="text-[13px] leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 overflow-hidden" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {streamedText + ' ▋'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div className="px-4 py-3 border-t border-accent/10 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                        setInput(e.target.value);
                        const el = e.target;
                        el.style.height = 'auto';
                        const scrollH = el.scrollHeight;
                        const capped = Math.min(scrollH, 200);
                        el.style.height = `${capped}px`;
                        el.style.overflowY = scrollH > 200 ? 'auto' : 'hidden';
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about AliScript..."
                    rows={1}
                    disabled={isActive}
                    className="ai-placeholder w-full bg-bg-secondary border border-accent/10 rounded-xl px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-secondary/25 outline-none resize-none leading-relaxed disabled:opacity-50"
                    style={{ fontFamily: 'inherit', maxHeight: '200px', overflowY: 'hidden' }}
                    aria-label="Chat message input"
                  />
                </div>
                <div className="shrink-0 flex flex-col justify-end h-full">
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => abortRef.current?.abort()}
                      className="w-[38px] h-[38px] flex items-center justify-center rounded-xl border border-sem-danger/30 bg-sem-danger/8 text-sem-danger hover:bg-sem-danger/15 transition-all cursor-pointer"
                      aria-label="Stop generating"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-[38px] h-[38px] flex items-center justify-center rounded-xl border border-accent/30 bg-accent/8 text-accent hover:bg-accent/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                      aria-label="Send message"
                    >
                      <Send size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-text-secondary/20 mt-1.5 text-center">
                Enter to send &middot; Shift+Enter for new line &middot; {input.length}/{MAX_MESSAGE_LENGTH}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
