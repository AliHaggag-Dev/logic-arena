'use client';

import React, { useRef, useState } from 'react';
import { Send, X, Image as ImageIcon } from 'lucide-react';
import { MAX_MESSAGE_LENGTH } from './constants';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: (image?: string | null) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isActive: boolean;
  onAbort: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isActive,
  onAbort,
  inputRef,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setSelectedImage(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleSendClick = () => {
    onSend(selectedImage);
    setSelectedImage(null);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    } else {
      onKeyDown(e);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-accent/10 shrink-0 flex flex-col gap-2">
      {selectedImage && (
        <div className="relative w-16 h-16 rounded-xl border border-accent/20 overflow-hidden group ml-1">
          <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => setSelectedImage(null)}
              className="p-1 bg-bg-primary/90 backdrop-blur-sm rounded-full text-text-secondary hover:text-sem-danger hover:bg-sem-danger/20 transition-colors cursor-pointer shadow-sm"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          aria-label="Upload image"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isActive}
          className="w-[42px] h-[42px] shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-bg-secondary text-text-secondary hover:text-accent hover:bg-accent/10 hover:border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none focus:ring-0"
          aria-label="Upload image"
          title="Attach Image"
        >
          <ImageIcon size={18} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                onInputChange(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                const scrollH = el.scrollHeight;
                const capped = Math.min(scrollH, 200);
                el.style.height = `${capped}px`;
                el.style.overflowY = scrollH > 200 ? 'auto' : 'hidden';
              }
            }}
            onKeyDown={handleKeyDownInternal}
            onPaste={handlePaste}
            placeholder="Ask anything about AliScript..."
            rows={1}
            disabled={isActive}
            className="ai-placeholder block w-full min-h-[42px] bg-bg-secondary border border-accent/10 rounded-xl px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-secondary/25 outline-none focus:outline-none focus:ring-0 resize-none leading-relaxed disabled:opacity-50"
            style={{ fontFamily: 'var(--font-alexandria), sans-serif', maxHeight: '200px', overflowY: 'hidden' }}
            dir="auto"
            aria-label="Chat message input"
          />
        </div>
        {isActive ? (
          <button
            type="button"
            onClick={onAbort}
            className="w-[42px] h-[42px] shrink-0 flex items-center justify-center rounded-xl border border-sem-danger/30 bg-sem-danger/8 text-sem-danger hover:bg-sem-danger/15 transition-all cursor-pointer focus:outline-none focus:ring-0"
            aria-label="Stop generating"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendClick}
            disabled={(!input.trim() && !selectedImage) || isActive}
            className="w-[42px] h-[42px] shrink-0 flex items-center justify-center rounded-xl border border-accent/30 bg-accent/8 text-accent hover:bg-accent/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none focus:ring-0"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        )}
      </div>
      <p className="text-[9px] text-text-secondary/20 mt-1.5 text-center">
        Enter to send &middot; Shift+Enter for new line &middot; {input.length}/{MAX_MESSAGE_LENGTH}
      </p>
    </div>
  );
}
