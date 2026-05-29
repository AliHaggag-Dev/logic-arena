'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  code: string;
  themeColor?: string;
  className?: string;
}

export const CopyButton = ({
  code,
  themeColor = 'var(--accent)',
  className = 'absolute top-3 right-3',
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setCopied(true);
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy code: ', err);
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={copied}
      className={`p-1.5 rounded-lg border transition-all duration-200 bg-bg-primary/80 backdrop-blur-sm z-20 ${
        copied
          ? 'opacity-100 cursor-default pointer-events-none'
          : 'opacity-60 hover:opacity-100 hover:bg-bg-primary active:scale-[0.93] cursor-pointer'
      } ${className}`}
      style={{
        borderColor: copied
          ? 'color-mix(in srgb, var(--sem-success) 30%, transparent)'
          : `color-mix(in srgb, ${themeColor} 20%, transparent)`,
        color: copied ? 'var(--sem-success)' : themeColor,
      }}
      aria-label="Copy code to clipboard"
      title="Copy code to clipboard"
    >
      {copied ? (
        <Check
          className="w-3.5 h-3.5 text-[color:var(--sem-success)] copy-success-icon"
          style={{ color: 'var(--sem-success)' }}
        />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
};
