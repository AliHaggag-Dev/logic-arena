import { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api-client';
import type { ChatMessage } from './types';
import { MAX_MESSAGE_LENGTH, MAX_HISTORY } from './constants';

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'streaming'>('idle');
  const [streamedText, setStreamedText] = useState('');
  const messagesRef = useRef<ChatMessage[]>([]);
  const streamedRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scrolling is now handled directly inside ChatMessages component

  const sendMessage = useCallback(async (text: string, image?: string | null) => {
    const sanitized = text.replace(/<[^>]*>/g, '').slice(0, MAX_MESSAGE_LENGTH).trim();
    if ((!sanitized && !image) || status !== 'idle') return;

    const userMessage: ChatMessage = { role: 'user', content: sanitized || 'Uploaded an image', image: image || undefined };
    setMessages((prev) => [...prev, userMessage]);
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
        body: JSON.stringify({ message: sanitized, history, image: image || undefined }),
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
      
      const finalContent = streamedRef.current;
      if (!aborted && !encounteredError && finalContent) {
        setMessages((prev) => [...prev, { role: 'model', content: finalContent }]);
      }
      
      setStreamedText('');
      streamedRef.current = '';
    }
  }, [status]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  function clearChat() {
    if (status !== 'idle') abortRef.current?.abort();
    setMessages([]);
    setStreamedText('');
    streamedRef.current = '';
    setStatus('idle');
  }

  const isActive = status !== 'idle';

  return {
    messages,
    status,
    streamedText,
    isActive,
    sendMessage,
    clearChat,
    abort,
    messagesEndRef,
  };
}
