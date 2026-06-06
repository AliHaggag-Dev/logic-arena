'use client';

const TOKEN_BAR_SEGMENTS = 12;

interface TokenCounterProps {
  current: number;
  max: number;
}

export function TokenCounter({ current, max }: TokenCounterProps) {
  const ratio = max > 0 ? current / max : 0;
  const filledSegments = Math.ceil(ratio * TOKEN_BAR_SEGMENTS);
  const isEmpty = current === 0;

  return (
    <div
      className={`flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest ${
        isEmpty ? 'animate-pulse' : ''
      }`}
      style={{ color: isEmpty ? 'var(--sem-danger)' : 'var(--accent)' }}
      aria-label={`Live tokens ${current} of ${max}`}
    >
      <span>
        LIVE TOKENS: {current} / {max}
      </span>
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: TOKEN_BAR_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className="h-2 w-3 rounded-[1px]"
            style={{
              background:
                index < filledSegments
                  ? isEmpty
                    ? 'var(--sem-danger)'
                    : 'var(--accent)'
                  : 'rgba(var(--accent-rgb), 0.12)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
