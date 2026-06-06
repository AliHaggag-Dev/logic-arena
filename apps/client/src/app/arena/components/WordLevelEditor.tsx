'use client';

import { useMemo, useState } from 'react';
import { TokenCounter } from './TokenCounter';

const CLASSIC_TOKEN_BUDGET = 10;

interface WordLevelEditorProps {
  script: string;
  tokensLeft: number;
  maxTokens?: number;
  onChange: (script: string, tokensLeft: number) => void;
}

export function WordLevelEditor({
  script,
  tokensLeft,
  maxTokens = CLASSIC_TOKEN_BUDGET,
  onChange,
}: WordLevelEditorProps) {
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [draftWord, setDraftWord] = useState('');
  const words = useMemo(
    () => script.split(/\s+/).filter((word) => word.length > 0),
    [script],
  );
  const disabled = tokensLeft === 0;

  const spendToken = (nextWords: string[]): void => {
    onChange(nextWords.join(' '), Math.max(0, tokensLeft - 1));
  };

  const deleteWord = (index: number): void => {
    if (disabled) return;
    spendToken(words.filter((_, wordIndex) => wordIndex !== index));
  };

  const openInsert = (index: number): void => {
    if (disabled) return;
    setInsertIndex(index);
    setDraftWord('');
  };

  const confirmInsert = (): void => {
    const word = draftWord.trim();
    if (insertIndex === null || word.length === 0 || disabled) return;
    const nextWords = [...words];
    nextWords.splice(insertIndex, 0, word);
    setInsertIndex(null);
    setDraftWord('');
    spendToken(nextWords);
  };

  return (
    <div className="flex min-h-0 grow flex-col gap-3">
      <TokenCounter current={tokensLeft} max={maxTokens} />
      <div
        className="min-h-64 grow rounded-lg border p-3 font-mono text-[13px] leading-7 select-none"
        style={{
          background: 'rgba(var(--bg-primary-rgb), 0.72)',
          borderColor: disabled
            ? 'rgba(var(--sem-danger-rgb), 0.45)'
            : 'rgba(var(--accent-rgb), 0.35)',
          color: 'var(--text-primary)',
        }}
        onCopy={(event) => event.preventDefault()}
        onCut={(event) => event.preventDefault()}
        onPaste={(event) => event.preventDefault()}
        onMouseDown={(event) => {
          if (event.detail > 1) event.preventDefault();
        }}
      >
        <button
          type="button"
          aria-label="Insert word at start"
          disabled={disabled}
          onClick={() => openInsert(0)}
          className="mx-0.5 inline-flex h-6 w-4 cursor-pointer items-center justify-center rounded disabled:cursor-default"
          style={{ border: '1px dashed rgba(var(--accent-rgb), 0.25)' }}
        />
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className="inline-flex items-center">
            {insertIndex === index && <InlineWordInput value={draftWord} setValue={setDraftWord} onConfirm={confirmInsert} />}
            <button
              type="button"
              disabled={disabled}
              onClick={() => deleteWord(index)}
              className="mx-0.5 cursor-pointer rounded border px-1.5 py-0.5 transition disabled:cursor-default"
              style={{
                borderColor: 'transparent',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor =
                  'rgba(var(--accent-rgb), 0.65)';
                event.currentTarget.style.boxShadow =
                  '0 0 12px rgba(var(--accent-rgb), 0.35)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = 'transparent';
                event.currentTarget.style.boxShadow = 'none';
              }}
            >
              {word}
            </button>
            <button
              type="button"
              aria-label={`Insert word after ${word}`}
              disabled={disabled}
              onClick={() => openInsert(index + 1)}
              className="mx-0.5 inline-flex h-6 w-4 cursor-pointer items-center justify-center rounded disabled:cursor-default"
              style={{ border: '1px dashed rgba(var(--accent-rgb), 0.25)' }}
            />
          </span>
        ))}
        {insertIndex === words.length && (
          <InlineWordInput
            value={draftWord}
            setValue={setDraftWord}
            onConfirm={confirmInsert}
          />
        )}
      </div>
    </div>
  );
}

function InlineWordInput({
  value,
  setValue,
  onConfirm,
}: {
  value: string;
  setValue: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <input
      aria-label="New word"
      autoFocus
      className="mx-1 h-7 w-24 rounded border bg-bg-primary px-2 text-text-primary outline-none"
      style={{ borderColor: 'rgba(var(--accent-rgb), 0.55)' }}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onConfirm();
      }}
    />
  );
}
